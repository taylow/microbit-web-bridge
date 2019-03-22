"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Debug_1 = require("./Debug");
const bufferpack_1 = require("bufferpack");
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
exports.HEADER_LENGTH = 5;
exports.HEADER_STRUCTURE = "<BBHB";
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
        // if the a payload was passed in, decode it
        if (payload != null) {
            this.decode(payload);
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
    getNamespaceID() {
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
        return bufferpack_1.pack(exports.HEADER_STRUCTURE, [this.app_id, this.namespace_id, this.uid, this.request_type]);
    }
    /***
     * Returns the non-formatted payload in array form.
     */
    getPayload() {
        return this.payload;
    }
    /***
     * Converts values found in the payload into an array of byte arrays ready for sending to the micro:bit.
     *
     * @returns The SerialPacket's payload in byte array form
     */
    getFormattedPayloadParts() {
        let formattedPayload = [];
        function isInt(n) {
            return Number(n) === n && n % 1 === 0;
        }
        function isFloat(n) {
            return Number(n) === n && n % 1 !== 0;
        }
        // format the payload data correctly
        for (let i = 0; i < this.payload.length; i++) {
            let value = this.payload[i];
            switch (typeof value) {
                case "number": // if int or float
                    if (isInt(value)) {
                        formattedPayload.push(bufferpack_1.pack("<Bi", [SubType.SUBTYPE_INT, value]));
                    }
                    else if (isFloat(value)) {
                        formattedPayload.push(bufferpack_1.pack("<Bf", [SubType.SUBTYPE_FLOAT, value]));
                    }
                    break;
                case "string": // if string
                    formattedPayload.push(bufferpack_1.pack(`<B${value.length + 1}s`, [SubType.SUBTYPE_STRING, (value + '\0')]));
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
     * 0 - 4 | app_id
     *       | namespace_id
     *       | uid
     *       | request_type
     *       |
     * 5 - n | payload contiguously stored
     * n + 1 | SLIP_END (192)
     */
    getFormattedPacket() {
        let finalPacket = new Uint8Array(this.length()); // create new array to store all others
        finalPacket.set(this.getHeader()); // add header to new array
        let offset = this.getHeader().length; // set offset to the length of the header
        // loop through all parts of the payload, adding each element at the offset
        this.getFormattedPayloadParts().forEach((item) => {
            // @ts-ignore
            finalPacket.set(item, offset);
            // @ts-ignore
            offset += item.length;
        });
        return Array.from(finalPacket).concat(SlipChar.SLIP_END);
    }
    /***
     * Calculates and returns the length total of the packet before any SLIP has been added.
     */
    length() {
        let length = 0;
        length += this.getHeader().length;
        // loop through all payload parts
        this.getFormattedPayloadParts().forEach((item) => {
            // @ts-ignore
            length += item.length;
        });
        return length;
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
        this.request_type = 0;
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
    decode(rawPayload) {
        if (rawPayload.length == 0)
            return;
        let data;
        let offset = 0;
        // grab subtype and the remainder of the packet
        let subtype = bufferpack_1.unpack("b", rawPayload);
        let remainder = rawPayload.slice(1);
        // compare against each subtype and process the data accordingly
        if (subtype & SubType.SUBTYPE_STRING) {
            data = "";
            // loop through all characters of the string
            for (let c in remainder) {
                if (String.fromCharCode(remainder[c]) == '\0') // if we find a terminating character, stop
                    break;
                data += String.fromCharCode(remainder[c]); // add the character to the data
            }
            offset = data.length + 1; // string is n + 1 bytes (+1 for terminating char)
        }
        else if (subtype & SubType.SUBTYPE_INT) {
            data = bufferpack_1.unpack("<i", remainder)[0]; //FIXME: This seems to return incorrect values (big/little endian?)
            offset = 4; // integer is 4 bytes
        }
        else if (subtype & SubType.SUBTYPE_FLOAT) {
            data = bufferpack_1.unpack("<f", remainder)[0];
            offset = 4; // float is 4 bytes
        }
        this.payload.push(data); // process last bit of payload that wasn't covered by the loop
        this.decode(remainder.slice(offset));
    }
    /***
     * Converts raw data into a SerialPacket for easy processing.
     *
     * @param data Raw serial data coming from the bridging micro:bit
     */
    static dataToSerialPacket(data) {
        let bytes = [];
        let payload;
        let header;
        for (let i = 0; i < data.length - 1; i++) {
            bytes.push(data.charCodeAt(i));
        }
        // unpack header using header structure
        header = bufferpack_1.unpack(exports.HEADER_STRUCTURE, bytes.slice(0, exports.HEADER_LENGTH));
        payload = bytes.slice(exports.HEADER_LENGTH);
        // create packet using the header bytes and the payload data
        return new SerialPacket(header[0], header[1], header[2], header[3], payload);
    }
}
exports.SerialPacket = SerialPacket;
//# sourceMappingURL=SerialPacket.js.map