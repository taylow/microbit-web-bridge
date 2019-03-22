"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dapjs_1 = require("dapjs");
const SerialPacket_1 = require("./SerialPacket");
const Debug_1 = require("./Debug");
const RequestHandler_1 = require("./RequestHandler");
const Mutex_1 = require("async-mutex/lib/Mutex");
class SerialHandler {
    /***
     * Creates a SerialHandler with a chosen DAPLink target and a baud given rate.
     *
     * @param targetDevice DAPLink target device to connect to
     * @param hubVariables Variables stored for communication of the hub
     * @param baud Baud rate of the serial communication (Default: 115200)
     */
    constructor(targetDevice, hubVariables, baud = 115200) {
        this.targetDevice = targetDevice;
        this.baud = baud;
        this.hubVariables = hubVariables;
        this.packetCount = 0;
        this.serialMutex = new Mutex_1.default();
        this.isPaused = false;
        this.setupSerialHandler();
    }
    /***
     * Adds an event listener to the DAPLink target to listen to serial events and process the data
     */
    setupSerialHandler() {
        this.targetDevice.on(dapjs_1.DAPLink.EVENT_SERIAL_DATA, data => {
            // if serial handling is paused, dont perform any actions
            if (this.isPaused)
                return;
            this.packetCount++;
            Debug_1.debug(`Packet count: ${this.packetCount}`, Debug_1.DebugType.DEBUG);
            let serialPacket;
            try {
                let requestHandler = new RequestHandler_1.RequestHandler(this.hubVariables); // create a RequestHandler to handle this request
                serialPacket = SerialPacket_1.SerialPacket.dataToSerialPacket(data); // convert the data to a SerialPacket
                console.log("Input Packet: ");
                //TODO: Debug stuff, remove once finished here
                let rawPacket = [];
                for (let i = 0; i < data.length; i++) {
                    rawPacket.push(data.charCodeAt(i));
                }
                console.log(data);
                console.log(rawPacket);
                console.log(serialPacket);
                // handle the request and await the promised resolve packet or reason for error
                requestHandler.handleRequest(serialPacket)
                    .then((responsePacket) => {
                    responsePacket.setRequestBit(SerialPacket_1.RequestStatus.REQUEST_STATUS_OK);
                    this.sendSerialPacket(responsePacket); // handle the request and send back the response
                })
                    .catch((reason) => {
                    Debug_1.debug(`${reason}`, Debug_1.DebugType.ERROR);
                    // clear all data from input packet and return it as an error packet
                    let responsePacket = new SerialPacket_1.SerialPacket(serialPacket.getAppID(), serialPacket.getNamespaceID(), serialPacket.getUID(), serialPacket.getReqRes());
                    responsePacket.clearAndError(reason);
                    this.sendSerialPacket(responsePacket);
                });
            }
            catch (e) {
                console.log(e);
                // clear serial packet and try to send an error response
                serialPacket.clearAndError("ERROR");
                this.sendSerialPacket(serialPacket);
            }
        });
    }
    /***
     * Sends a SerialPacket to the device via serial communication in the correct format required.
     *
     * @param serialPacket Serial packet to send to bridge micro:bit
     */
    sendSerialPacket(serialPacket) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Output Packet");
            console.log(serialPacket);
            let packet = String.fromCharCode(...serialPacket.getFormattedPacket());
            console.log("RAW PACKET: ");
            console.log(serialPacket.getFormattedPacket());
            try {
                // acquire mutex to prevent concurrent serial writes
                this.serialMutex.acquire()
                    .then((release) => {
                    this.targetDevice.serialWrite(packet);
                    release(); // release mutex (must be released or will lock all communication)
                });
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    /***
     * Sends a sad face to the bridge micro:bit
     */
    sendSadFace() {
        let responsePacket = new SerialPacket_1.SerialPacket(0, 0, 0, SerialPacket_1.RequestType.REQUEST_TYPE_HELLO);
        responsePacket.append(-1);
        this.sendSerialPacket(responsePacket);
    }
    /***
     * Sends a happy face to the bridge micro:bit
     */
    sendHappyFace() {
        let responsePacket = new SerialPacket_1.SerialPacket(0, 0, 0, SerialPacket_1.RequestType.REQUEST_TYPE_HELLO);
        responsePacket.append(0);
        this.sendSerialPacket(responsePacket);
    }
    /***
     * Pauses the serial handler for other serial communication (e.g. flashing).
     */
    pause() {
        this.isPaused = true;
    }
    /***
     * Pauses the serial handler for other serial communication (e.g. flashing).
     */
    play() {
        this.isPaused = false;
    }
}
exports.SerialHandler = SerialHandler;
//# sourceMappingURL=SerialHandler.js.map