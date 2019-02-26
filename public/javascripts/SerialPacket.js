"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Debug_1 = require("./Debug");
var SerialPacket = /** @class */ (function () {
    /***
     * Creates a SerialPacket and initialises header and payload variables.
     *
     * @param app_id app_id from the micro:bit
     * @param namespace_id namespace_id from the micro:bit
     * @param uid uid from the micro:bit
     * @param request_type request_type from the micro:bit
     * @param response_type response_type from the micro:bit
     * @param payload Encoded prototype from the micro:bit
     */
    function SerialPacket(app_id, namespace_id, uid, request_type, payload) {
        this.app_id = app_id;
        this.namespace_id = namespace_id;
        this.uid = uid;
        this.request_type = request_type;
        this.payload = [];
        if (payload != null) {
            this.payload = this.decode(payload);
        }
    }
    /***
     * Returns the app_id of the packet.
     */
    SerialPacket.prototype.getAppID = function () {
        return this.app_id;
    };
    /***
     * Returns the namespace_id of the packet.
     */
    SerialPacket.prototype.getNamespcaeID = function () {
        return this.namespace_id;
    };
    /***
     * Returns the UID of the packet.
     */
    SerialPacket.prototype.getUID = function () {
        return this.uid;
    };
    /***
     * Returns the request_type or'ed with the response_type.
     */
    SerialPacket.prototype.getReqRes = function () {
        return this.request_type;
    };
    /***
     * Returns the header in a byte array ready for sending to the micro:bit.
     */
    SerialPacket.prototype.getHeader = function () {
        return [this.getAppID(), this.getNamespcaeID(), this.getUID(), this.getReqRes()];
    };
    /***
     * Converts values found in the payload into a byte array ready for sending to the micro:bit.
     */
    SerialPacket.prototype.getPayload = function () {
        var formattedPayload = [];
        // format the payload data correctly
        for (var i = 0; i < this.payload.length; i++) {
            var value = this.payload[i];
            switch (typeof value) {
                case "number": // if int or float
                    var buf = new ArrayBuffer(4);
                    var view = new DataView(buf);
                    if (value % 1 === 0) {
                        // if integer, use uint32
                        formattedPayload.push(2 /* SUBTYPE_INT */);
                        view.setUint32(0, value, false);
                    }
                    else { // if (value % 1 !== 0) {
                        // if float use float32
                        formattedPayload.push(4 /* SUBTYPE_FLOAT */);
                        view.setFloat32(0, value, false);
                    }
                    // push the 4 bytes onto the data array
                    for (var i_1 = 0; i_1 < buf.byteLength; i_1++)
                        formattedPayload.push(view.getUint8(i_1));
                    break;
                case "string": // if string
                    formattedPayload.push(1 /* SUBTYPE_STRING */); // push the string subtype byte to the formatted payload
                    // push all characters onto data array
                    for (var i_2 = 0; i_2 < value.length; i_2++)
                        formattedPayload.push(value.charCodeAt(i_2)); // push each character code to the payload
                    break;
                default:
                    //TODO: Implement Events
                    Debug_1.debug("FOUND UNIMPLEMENTED SUBTYPE WHILE ENCODING PACKET " + typeof value + " (" + value + ")", Debug_1.DebugType.WARNING);
            }
        }
        return formattedPayload;
    };
    /***
     * Returns a formatted packet in byte array form.
     */
    SerialPacket.prototype.getFormattedPacket = function () {
        //TODO: Process the packet correctly and correctly implement SLIP
        return [0].concat(this.getHeader().concat(this.getPayload())).concat([192 /* SLIP_END */]);
    };
    /***
     * Appends a variable onto the end of the payload.
     *
     * @param variable The variable to add to the SerialPacket payload
     */
    SerialPacket.prototype.append = function (variable) {
        this.payload.push(variable);
    };
    /***
     * Removes an element from the payload at a given index.
     *
     * @param index Index of the variable to remove
     */
    SerialPacket.prototype.remove = function (index) {
        this.payload = this.payload.slice(0, index).concat(this.payload.slice(index + 1));
    };
    /***
     * Returns a payload variable at a given index.
     *
     * @param index Index of the variable
     * @return The element from the payload at index
     */
    SerialPacket.prototype.get = function (index) {
        return this.payload[index];
    };
    SerialPacket.prototype.clear = function () {
        this.payload = [];
    };
    /***
     * Unmarshalls a pre-marshelled payload into an array of any type.
     *
     * E.g. Takes [1, 84, 69, 83, 84, 2, 0, 0, 0, 100]
     *      And converts to ["TEST", 100]
     *
     * @param rawPayload A byte array of marshalled variables
     */
    SerialPacket.prototype.decode = function (rawPayload) {
        var payload = [];
        var data = [];
        var subtype = -1;
        for (var i = 0; i < rawPayload.length; i++) {
            switch (rawPayload[i]) {
                case 1 /* SUBTYPE_STRING */:
                case 2 /* SUBTYPE_INT */:
                case 4 /* SUBTYPE_FLOAT */:
                case 8 /* SUBTYPE_EVENT */:
                    // if we already have data, process it before going onto next byte
                    if (subtype !== -1) {
                        payload.push(this.decodeSubType(data, subtype));
                    }
                    subtype = rawPayload[i]; // set subtype
                    data = []; // delete previous data
                    break;
                default:
                    data.push(rawPayload[i]); // push byte onto current data
                    break;
            }
        }
        payload.push(this.decodeSubType(data, subtype)); // process last bit of payload that wasn't covered by the loop
        return payload;
    };
    /***
     * Decodes data with their given subtype and returns the correct data.
     *
     * Subtypes:
     *      SUBTYPE_STRING = 0x01
     *      SUBTYPE_INT = 0x02
     *      SUBTYPE_FLOAT = 0x04
     *      SUBTYPE_EVENT = 0x08
     *
     * @param data The raw byte array data of one of the given subtypes
     * @param subtype The subtype of the data (see list above)
     * @returns The data in its correct format (e.g. [2, 0, 0, 0, 0] = (int) 0)
     */
    SerialPacket.prototype.decodeSubType = function (data, subtype) {
        var buf = new ArrayBuffer(4);
        var view = new DataView(buf);
        switch (subtype) {
            case 1 /* SUBTYPE_STRING */:
                var str = String.fromCharCode.apply(null, data);
                // remove terminating 0
                if (str.charCodeAt(str.length - 1) === 0)
                    str = str.substr(0, str.length - 1);
                Debug_1.debug("String found: " + str, Debug_1.DebugType.DEBUG);
                return str;
            case 2 /* SUBTYPE_INT */:
                // put each byte of int into data view
                data.forEach(function (b, i) {
                    view.setUint8(i, b);
                });
                var int = view.getInt32(0);
                Debug_1.debug("Int found: " + int, Debug_1.DebugType.DEBUG);
                return int;
            case 4 /* SUBTYPE_FLOAT */:
                // put each byte of int into data view
                data.forEach(function (b, i) {
                    view.setUint8(i, b);
                });
                var float = view.getFloat32(0);
                Debug_1.debug("Float found: " + float, Debug_1.DebugType.DEBUG);
                return float;
            case 8 /* SUBTYPE_EVENT */:
                Debug_1.debug("Event found: UNIMPLIMENTED", Debug_1.DebugType.DEBUG);
                //TODO: Implement events
                break;
            default:
                Debug_1.debug("Unimplemented subtype: " + subtype + " (" + data + ")", Debug_1.DebugType.WARNING);
        }
    };
    return SerialPacket;
}());
exports.SerialPacket = SerialPacket;
//# sourceMappingURL=SerialPacket.js.map