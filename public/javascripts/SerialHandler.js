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
                //TODO: Pass RequestHandler and SerialPacket into a Web Worker to process the packet in a new thread
                let requestHandler = new RequestHandler_1.RequestHandler(this.hubVariables); // create a RequestHandler to handle this request
                serialPacket = SerialHandler.dataToSerialPacket(data); // convert the data to a SerialPacket
                console.log("Input Packet: ");
                console.log(serialPacket);
                // handle the request and await the promised resolve packet or reason for error
                requestHandler.handleRequest(serialPacket)
                    .then((responsePacket) => {
                    this.sendSerialPacket(responsePacket); // handle the request and send back the response
                })
                    .catch((reason) => {
                    Debug_1.debug(`${reason}`, Debug_1.DebugType.ERROR);
                    // clear all data from input packet and return it as an error packet
                    let responsePacket = new SerialPacket_1.SerialPacket(serialPacket.getAppID(), serialPacket.getNamespcaeID(), serialPacket.getUID(), serialPacket.getReqRes());
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
     * Converts raw data into a SerialPacket for easy processing
     *
     * @param data Raw serial data coming from the bridging micro:bit
     */
    static dataToSerialPacket(data) {
        let payload = [];
        let offset = 0;
        //TODO: This was a temporary fix for the byte shifting
        if (data.charCodeAt(0) != 0) {
            offset = -1;
        }
        //TODO: Currently doesn't decode SLIP entirely, only removes the last character (len - 1) which should be 192
        for (let i = 5 + offset; i < data.length - 1 + offset; i++) {
            payload.push(data.charCodeAt(i));
        }
        // create packet using the header bytes and the payload data
        return new SerialPacket_1.SerialPacket(data.charCodeAt(1 + offset), data.charCodeAt(2 + offset), data.charCodeAt(3 + offset), data.charCodeAt(4 + offset), payload);
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
            try {
                // acquire mutex to prevent concurrent serial writes
                this.serialMutex.acquire()
                    .then((release) => {
                    this.targetDevice.serialWrite(String.fromCharCode(...serialPacket.getFormattedPacket()));
                    release(); // release mutex (must be released or will lock all communication)
                });
            }
            catch (e) {
                console.log(e);
            }
        });
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