"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Debug_1 = require("./Debug");
var SubType;
(function (SubType) {
    SubType[SubType["SUBTYPE_STRING"] = 1] = "SUBTYPE_STRING";
    SubType[SubType["SUBTYPE_INT"] = 2] = "SUBTYPE_INT";
    SubType[SubType["SUBTYPE_FLOAT"] = 4] = "SUBTYPE_FLOAT";
    SubType[SubType["SUBTYPE_EVENT"] = 8] = "SUBTYPE_EVENT";
})(SubType = exports.SubType || (exports.SubType = {}));
var RequestType;
(function (RequestType) {
    RequestType[RequestType["REQUEST_TYPE_GET_REQUEST"] = 1] = "REQUEST_TYPE_GET_REQUEST";
    RequestType[RequestType["REQUEST_TYPE_POST_REQUEST"] = 2] = "REQUEST_TYPE_POST_REQUEST";
    RequestType[RequestType["REQUEST_TYPE_CLOUD_VARIABLE"] = 4] = "REQUEST_TYPE_CLOUD_VARIABLE";
    RequestType[RequestType["REQUEST_TYPE_BROADCAST"] = 8] = "REQUEST_TYPE_BROADCAST";
    RequestType[RequestType["REQUEST_TYPE_HELLO"] = 16] = "REQUEST_TYPE_HELLO";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus[RequestStatus["REQUEST_STATUS_ACK"] = 32] = "REQUEST_STATUS_ACK";
    RequestStatus[RequestStatus["REQUEST_STATUS_ERROR"] = 64] = "REQUEST_STATUS_ERROR";
    RequestStatus[RequestStatus["REQUEST_STATUS_OK"] = 128] = "REQUEST_STATUS_OK";
})(RequestStatus = exports.RequestStatus || (exports.RequestStatus = {}));
var SlipChar;
(function (SlipChar) {
    SlipChar[SlipChar["SLIP_END"] = 192] = "SLIP_END";
    SlipChar[SlipChar["SLIP_ESC"] = 219] = "SLIP_ESC";
    SlipChar[SlipChar["SLIP_ESC_END"] = 220] = "SLIP_ESC_END";
    SlipChar[SlipChar["SLIP_ESC_ESC"] = 221] = "SLIP_ESC_ESC";
})(SlipChar = exports.SlipChar || (exports.SlipChar = {}));
class SerialPacket {
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
    constructor(app_id, namespace_id, uid, request_type, payload) {
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
    getAppID() {
        return this.app_id;
    }
    /***
     * Returns the namespace_id of the packet.
     */
    getNamespcaeID() {
        return this.namespace_id;
    }
    /***
     * Returns the UID of the packet.
     */
    getUID() {
        return this.uid;
    }
    /***
     * Returns the request_type or'ed with the response_type.
     */
    getReqRes() {
        return this.request_type;
    }
    /***
     * Returns the header in a byte array ready for sending to the micro:bit.
     */
    getHeader() {
        return [this.getAppID(), this.getNamespcaeID(), this.getUID(), this.getReqRes()];
    }
    /***
     * Returns the non-formatted payload in array form.
     */
    getPayload() {
        return this.payload;
    }
    /***
     * Converts values found in the payload into a byte array ready for sending to the micro:bit.
     *
     * @returns The SerialPacket's payload in byte array form
     */
    getFormattedPayload() {
        let formattedPayload = [];
        // format the payload data correctly
        for (let i = 0; i < this.payload.length; i++) {
            let value = this.payload[i];
            switch (typeof value) {
                case "number": // if int or float
                    let buf = new ArrayBuffer(4);
                    let view = new DataView(buf);
                    if (value % 1 === 0) {
                        // if integer, use uint32
                        formattedPayload.push(SubType.SUBTYPE_INT);
                        view.setUint32(0, value, false);
                    }
                    else { // if (value % 1 !== 0) {
                        // if float use float32
                        formattedPayload.push(SubType.SUBTYPE_FLOAT);
                        view.setFloat32(0, value, false);
                    }
                    // push the 4 bytes onto the data array
                    for (let i = 0; i < buf.byteLength; i++)
                        formattedPayload.push(view.getUint8(i));
                    break;
                case "string": // if string
                    formattedPayload.push(SubType.SUBTYPE_STRING); // push the string subtype byte to the formatted payload
                    // push all characters onto data array
                    for (let i = 0; i < value.length; i++)
                        formattedPayload.push(value.charCodeAt(i)); // push each character code to the payload
                    break;
                default:
                    //TODO: Implement Events
                    Debug_1.debug(`FOUND UNIMPLEMENTED SUBTYPE WHILE ENCODING PACKET ${typeof value} (${value})`, Debug_1.DebugType.WARNING);
            }
        }
        return formattedPayload;
    }
    /***
     * Returns a formatted packet in byte array form.
     *
     * Byte  |   Use
     * -------------------------
     * 0     | Unused, always 0
     * 1     | app_id
     * 2     | namespace_id
     * 3     | uid
     * 4     | request_type
     * 5 - n | payload contiguously stored
     * n + 1 | SLIP_END (192)
     */
    getFormattedPacket() {
        return [0].concat(this.getHeader().concat(this.getFormattedPayload())).concat([SlipChar.SLIP_END]);
    }
    /***
     * Sets a bit in the request_type header byte.
     * @param bitValue The bit to set
     */
    setRequestBit(bitValue) {
        this.request_type |= bitValue;
    }
    /***
     * Clears a given bit in the request_type header byte.
     * @param bitValue The bit to clear
     */
    clearRequestBit(bitValue) {
        this.request_type &= ~bitValue;
    }
    /***
     * Modifies the SerialPacket to return an error status by clearing any previously set status flags
     * while retaining the request type (e.g. REST, hello, etc.)
     */
    clearAndError(errorMessage) {
        // clear all other status codes
        for (let status in RequestStatus) {
            this.clearRequestBit(Number(status));
        }
        // set status code to REQUEST_STATUS_ERROR
        this.setRequestBit(RequestStatus.REQUEST_STATUS_ERROR);
        // clear payload and add an error message if necessary
        this.clear();
        if (errorMessage.length > 0)
            this.append(errorMessage);
        return this;
    }
    /***
     * Appends a variable onto the end of the payload.
     *
     * @param variable The variable to add to the SerialPacket payload
     */
    append(variable) {
        this.payload.push(variable);
    }
    /***
     * Removes an element from the payload at a given index.
     *
     * @param index Index of the variable to remove
     */
    remove(index) {
        this.payload = this.payload.slice(0, index).concat(this.payload.slice(index + 1));
    }
    /***
     * Returns a payload variable at a given index.
     *
     * @param index Index of the variable
     * @return The element from the payload at index
     */
    get(index) {
        return this.payload[index];
    }
    clear() {
        this.payload = [];
    }
    /***
     * Unmarshalls a pre-marshelled payload into an array of any type.
     *
     * E.g. Takes [1, 84, 69, 83, 84, 2, 0, 0, 0, 100]
     *      And converts to ["TEST", 100]
     *
     * @param rawPayload A byte array of marshalled variables
     */
    decode(rawPayload) {
        let payload = [];
        let data = [];
        let subtype = -1;
        for (let i = 0; i < rawPayload.length; i++) {
            switch (rawPayload[i]) {
                case SubType.SUBTYPE_STRING:
                case SubType.SUBTYPE_INT:
                case SubType.SUBTYPE_FLOAT:
                case SubType.SUBTYPE_EVENT:
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
    }
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
    decodeSubType(data, subtype) {
        let buf = new ArrayBuffer(4);
        let view = new DataView(buf);
        switch (subtype) {
            case SubType.SUBTYPE_STRING:
                let str = String.fromCharCode.apply(null, data);
                // remove terminating 0
                if (str.charCodeAt(str.length - 1) === 0)
                    str = str.substr(0, str.length - 1);
                // debug(`String found: ${str}`, DebugType.DEBUG);
                return str;
            case SubType.SUBTYPE_INT:
                // put each byte of int into data view
                data.forEach(function (b, i) {
                    view.setUint8(i, b);
                });
                let int = view.getInt32(0);
                // debug(`Int found: ${int}`, DebugType.DEBUG);
                return int;
            case SubType.SUBTYPE_FLOAT:
                // put each byte of int into data view
                data.forEach(function (b, i) {
                    view.setUint8(i, b);
                });
                let float = view.getFloat32(0);
                // debug(`Float found: ${float}`, DebugType.DEBUG);
                return float;
            case SubType.SUBTYPE_EVENT:
                Debug_1.debug(`Event found: UNIMPLIMENTED`, Debug_1.DebugType.DEBUG);
                //TODO: Implement events
                break;
            default:
                Debug_1.debug(`Unimplemented subtype: ${subtype} (${data})`, Debug_1.DebugType.WARNING);
        }
    }
}
exports.SerialPacket = SerialPacket;
//# sourceMappingURL=SerialPacket.js.map