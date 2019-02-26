import {Packet} from "./Packet";
import {debug, DebugType} from "./Debug";

export const enum SubType {
    SUBTYPE_STRING = 0x01,
    SUBTYPE_INT = 0x02,
    SUBTYPE_FLOAT = 0x04,
    SUBTYPE_EVENT = 0x08
}

export const enum RequestType {
    REQUEST_TYPE_GET_REQUEST = 0x01,
    REQUEST_TYPE_POST_REQUEST = 0x02,
    REQUEST_TYPE_CLOUD_VARIABLE = 0x04,
    REQUEST_TYPE_BROADCAST = 0x08,
    REQUEST_TYPE_HELLO = 0x10
}

export const enum RequestStatus {
    REQUEST_STATUS_ACK = 0x20,
    REQUEST_STATUS_ERROR = 0x40,
    REQUEST_STATUS_OK = 0x80
}

export const enum SlipChar {
    SLIP_END = 0xC0,
    SLIP_ESC = 0xDB,
    SLIP_ESC_END = 0xDC,
    SLIP_ESC_ESC = 0xDD
}

export class SerialPacket implements Packet {
    app_id: number;
    namespace_id: number;
    uid: number;
    request_type: number;
    payload: any[];

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
    constructor(app_id: number, namespace_id: number, uid: number, request_type?:number, payload?:number[]) {
        this.app_id = app_id;
        this.namespace_id = namespace_id;
        this.uid = uid;
        this.request_type = request_type;
        this.payload = [];

        if(payload != null) {
            this.payload = this.decode(payload);
        }
    }

    /***
     * Returns the app_id of the packet.
     */
    public getAppID(): number {
        return this.app_id;
    }

    /***
     * Returns the namespace_id of the packet.
     */
    public getNamespcaeID(): number {
        return this.namespace_id;
    }

    /***
     * Returns the UID of the packet.
     */
    public getUID(): number {
        return this.uid;
    }

    /***
     * Returns the request_type or'ed with the response_type.
     */
    public getReqRes(): number {
        return this.request_type;
    }

    /***
     * Returns the header in a byte array ready for sending to the micro:bit.
     */
    public getHeader(): number[] {
        return [this.getAppID(), this.getNamespcaeID(), this.getUID(), this.getReqRes()];
    }

    /***
     * Converts values found in the payload into a byte array ready for sending to the micro:bit.
     */
    public getPayload(): number[] {
        let formattedPayload: any = [];

        // format the payload data correctly
        for(let i = 0; i < this.payload.length; i++) {
            let value: unknown = this.payload[i];

            switch(typeof value) {
                case "number": // if int or float
                    let buf = new ArrayBuffer(4);
                    let view = new DataView(buf);

                    if (value % 1 === 0) {
                        // if integer, use uint32
                        formattedPayload.push(SubType.SUBTYPE_INT);
                        view.setUint32(0, value, false);
                    } else { // if (value % 1 !== 0) {
                        // if float use float32
                        formattedPayload.push(SubType.SUBTYPE_FLOAT);
                        view.setFloat32(0, value, false);
                    }

                    // push the 4 bytes onto the data array
                    for (let i = 0; i < buf.byteLength; i++) formattedPayload.push(view.getUint8(i));
                    break;

                case "string": // if string
                    formattedPayload.push(SubType.SUBTYPE_STRING); // push the string subtype byte to the formatted payload

                    // push all characters onto data array
                    for (let i = 0; i < (<string> value).length; i++) formattedPayload.push(value.charCodeAt(i)); // push each character code to the payload
                    break;

                default:
                    //TODO: Implement Events
                    debug(`FOUND UNIMPLEMENTED SUBTYPE WHILE ENCODING PACKET ${typeof value} (${value})`, DebugType.WARNING);
            }
        }
        return formattedPayload;
    }

    /***
     * Returns a formatted packet in byte array form.
     */
    public getFormattedPacket(): number[] {
        //TODO: Process the packet correctly and correctly implement SLIP
        return [0].concat(this.getHeader().concat(this.getPayload())).concat([SlipChar.SLIP_END]);
    }

    /***
     * Appends a variable onto the end of the payload.
     *
     * @param variable The variable to add to the SerialPacket payload
     */
    public append(variable: any) {
        this.payload.push(variable);
    }

    /***
     * Removes an element from the payload at a given index.
     *
     * @param index Index of the variable to remove
     */
    public remove(index: number) {
        this.payload = this.payload.slice(0, index).concat(this.payload.slice(index + 1));
    }

    /***
     * Returns a payload variable at a given index.
     *
     * @param index Index of the variable
     * @return The element from the payload at index
     */
    public get(index: number): any {
        return this.payload[index];
    }

    public clear() {
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
    public decode(rawPayload: number[]): any[] {
        let payload = [];
        let data = [];
        let subtype = -1;

        for(let i = 0; i < rawPayload.length; i++) {
            switch(rawPayload[i]) {
                case SubType.SUBTYPE_STRING:
                case SubType.SUBTYPE_INT:
                case SubType.SUBTYPE_FLOAT:
                case SubType.SUBTYPE_EVENT:
                    // if we already have data, process it before going onto next byte
                    if(subtype !== -1) {
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
    public decodeSubType(data: any[], subtype: number) {
        let buf = new ArrayBuffer(4);
        let view = new DataView(buf);

        switch(subtype) {
            case SubType.SUBTYPE_STRING:
                let str = String.fromCharCode.apply(null, data);

                // remove terminating 0
                if(str.charCodeAt(str.length - 1) === 0)
                    str = str.substr(0,str.length - 1);

                debug(`String found: ${str}`, DebugType.DEBUG);
                return str;

            case SubType.SUBTYPE_INT:
                // put each byte of int into data view
                data.forEach(function (b, i) {
                    view.setUint8(i, b);
                });
                let int = view.getInt32(0);
                debug(`Int found: ${int}`, DebugType.DEBUG);
                return int;

            case SubType.SUBTYPE_FLOAT:
                // put each byte of int into data view
                data.forEach(function (b, i) {
                    view.setUint8(i, b);
                });
                let float = view.getFloat32(0);
                debug(`Float found: ${float}`, DebugType.DEBUG);
                return float;

            case SubType.SUBTYPE_EVENT:
                debug(`Event found: UNIMPLIMENTED`, DebugType.DEBUG);
                //TODO: Implement events
                break;

            default:
                debug(`Unimplemented subtype: ${subtype} (${data})`, DebugType.WARNING);
        }
    }
}