import {DAPLink} from "dapjs";
import {SerialPacket} from "./SerialPacket";
import {debug, DebugType} from "./Debug";
import {RequestHandler} from "./RequestHandler";
import Mutex from "async-mutex/lib/Mutex";

export class SerialHandler {
    private targetDevice: DAPLink;
    private baud: number;
    private readonly hubVariables: {};
    private packetCount: number;
    private serialMutex: Mutex;
    private isPaused: boolean;

    /***
     * Creates a SerialHandler with a chosen DAPLink target and a baud given rate.
     *
     * @param targetDevice DAPLink target device to connect to
     * @param hubVariables Variables stored for communication of the hub
     * @param baud Baud rate of the serial communication (Default: 115200)
     */
    constructor(targetDevice: DAPLink, hubVariables: {}, baud = 115200) {
        this.targetDevice = targetDevice;
        this.baud = baud;
        this.hubVariables = hubVariables;
        this.packetCount = 0;
        this.serialMutex = new Mutex();
        this.isPaused = false;
        this.setupSerialHandler();
    }

    /***
     * Adds an event listener to the DAPLink target to listen to serial events and process the data
     */
    private setupSerialHandler() {
        this.targetDevice.on(DAPLink.EVENT_SERIAL_DATA, data => {
            // if serial handling is paused, dont perform any actions
            if(this.isPaused)
                return;

            this.packetCount++;
            debug(`Packet count: ${this.packetCount}`, DebugType.DEBUG);

            let serialPacket: SerialPacket;

            try {
                //TODO: Pass RequestHandler and SerialPacket into a Web Worker to process the packet in a new thread

                let requestHandler = new RequestHandler(this.hubVariables); // create a RequestHandler to handle this request
                serialPacket = SerialHandler.dataToSerialPacket(data); // convert the data to a SerialPacket

                console.log("Input Packet: ");
                console.log(serialPacket);

                // handle the request and await the promised resolve packet or reason for error
                requestHandler.handleRequest(serialPacket)
                    .then((responsePacket) => {
                        this.sendSerialPacket(responsePacket); // handle the request and send back the response
                    })
                    .catch((reason) => {
                        debug(`${reason}`, DebugType.ERROR);

                        // clear all data from input packet and return it as an error packet
                        let responsePacket = new SerialPacket(serialPacket.getAppID(), serialPacket.getNamespcaeID(), serialPacket.getUID(), serialPacket.getReqRes());
                        responsePacket.clearAndError(reason);
                        this.sendSerialPacket(responsePacket);
                    });
            } catch (e) {
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
    private static dataToSerialPacket(data: string): SerialPacket {
        let payload = [];
        let offset = 0;

        //TODO: This was a temporary fix for the byte shifting
        if(data.charCodeAt(0) != 0) {
            offset = -1;
        }

        //TODO: Currently doesn't decode SLIP entirely, only removes the last character (len - 1) which should be 192
        for(let i = 5 + offset; i < data.length - 1 + offset; i++) {
            payload.push(data.charCodeAt(i));
        }

        // create packet using the header bytes and the payload data
        return new SerialPacket(data.charCodeAt(1 + offset), data.charCodeAt(2 + offset), data.charCodeAt(3 + offset), data.charCodeAt(4 + offset), payload);
    }

    /***
     * Sends a SerialPacket to the device via serial communication in the correct format required.
     *
     * @param serialPacket Serial packet to send to bridge micro:bit
     */
    public async sendSerialPacket(serialPacket: SerialPacket) {
        console.log("Output Packet");
        console.log(serialPacket);

        try {
            // acquire mutex to prevent concurrent serial writes
            this.serialMutex.acquire()
                .then((release) => {
                    this.targetDevice.serialWrite(String.fromCharCode(...serialPacket.getFormattedPacket()));
                    release(); // release mutex (must be released or will lock all communication)
                });
        } catch(e) {
            console.log(e);
        }
    }

    /***
     * Pauses the serial handler for other serial communication (e.g. flashing).
     */
    public pause() {
        this.isPaused = true;
    }

    /***
     * Pauses the serial handler for other serial communication (e.g. flashing).
     */
    public play() {
        this.isPaused = false;
    }
}