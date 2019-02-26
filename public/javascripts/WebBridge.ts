import * as $ from "jquery";
import {DAPLink} from 'dapjs/lib/daplink';
import {WebUSB} from 'dapjs/lib/transport/webusb';
import {debug, DebugType} from "./Debug";
import {RequestHandler} from "./RequestHandler";
import {RequestStatus, SerialPacket} from "./SerialPacket";
import {createWorker, ITypedWorker} from "typed-web-workers";


const DEFAULT_BAUD = 115200;
const DEFAULT_STATUS = "Connect to a micro:bit and flash the bridging software";

const statusText = $('#status');
const connectButton = $('#connect');
const flashButton = $('#flash');

let targetDevice;
let translations;
let packetCount = 0;

let hub_variables = {
    "authenticated": false,
    "credentials": {
        "school_id": "",
        "pi_id": ""
    },
    "cloud_variable_socket": {
        "address": "localhost",
        "port": 8001
    },
    "translations_json": {
        "url": "https://raw.githubusercontent.com/lancaster-university/rest-radio/master/hub/translations.json",
        "poll_time": 60
    }
};

function getHB() {
    return hub_variables;
}

function getTranslations() {
    return $.ajax({
        url: '/translations',
        method: 'GET',
        dataType: 'JSON',
        cache: false,
        timeout: 10000,
        error: () => {
            debug(`Error receiving translations`, DebugType.ERROR);
            return false;
        },
        success: (response) => {
            return response;
        }
    });
}

$.when(getTranslations()).done((translations) => {
    hub_variables.translations_json = translations;
    debug("Translations downloaded", DebugType.DEBUG);
});


/***
 * Opens option to choose a webUSB device filtered using micro:bit's vendor ID.
 */
function selectDevice() {
    setStatus("Select a device");

    navigator.usb.requestDevice({
        filters: [{vendorId: 0xD28}]
    })
    .then((device) => {
        connect(device, DEFAULT_BAUD);
    })
    .catch((error) => {
        setStatus(error);
    });
}

/***
 * Converts raw data into a SerialPacket for easy processing
 *
 * @param data Raw serial data coming from the bridging micro:bit
 */
function dataToSerialPacket(data: string) {
    let payload = [];

    //TODO: this doesn't decode SLIP, only removes the last character (len - 1)
    for(let i = 5; i < data.length - 1; i++) {
        payload.push(data.charCodeAt(i));
    }

    return new SerialPacket(data.charCodeAt(1), data.charCodeAt(2), data.charCodeAt(3), data.charCodeAt(4), payload);
}

/***
 * Connect to given device with chosen baud rate and add listeners for receiving and disconnections.
 *
 * @param device WebUSB micro:bit instance
 * @param baud Baud rate for serial communication between micro:bit (usually 115200)
 * @returns {PromiseLike<T | never>}
 */
function connect(device, baud: number) {
    setStatus("Connecting...");

    const transport = new WebUSB(device);
    const target = new DAPLink(transport);

    navigator.usb.addEventListener('disconnect', () => {
        setStatus("Disconnected");
        target.stopSerialRead();
        target.disconnect();
        connectButton.text("Connect");
    });

    target.on(DAPLink.EVENT_SERIAL_DATA, data => {
        //TODO: Use Web Workers to move these into a new thread
        packetCount++;
        console.log(`Received (${packetCount}): ${data}`);

        // debug stuff TODO: remove
        let dataBytes = [];
        for(let i = 0; i < data.length; i++) {
            dataBytes.push(data.charCodeAt(i)); // push the byte value onto dataByte array
        }
        console.log(dataBytes);

        let serialPacket;

        try {
            // create a typed web worker
           /* const typedWorker: ITypedWorker<{ serialPacket: SerialPacket, requestHandler: RequestHandler }, SerialPacket> = createWorker(
                (input, cb) => cb(input.requestHandler.handleRequest(input.serialPacket)),
                (responsePacket) => {
                    console.log(responsePacket);
                    targetDevice.serialWrite(String.fromCharCode(...responsePacket.getFormattedPacket()));
                } //TODO: send the packet back
            );*/

            // create a request handler and parse the incoming data into a SerialPacket
            let requestHandler = new RequestHandler(hub_variables.translations_json, hub_variables);
            serialPacket = dataToSerialPacket(data);

            //typedWorker.postMessage({ serialPacket: serialPacket, requestHandler: requestHandler }); // pass the serial packet and request handler to the web worker

            serialPacket = requestHandler.handleRequest(serialPacket);

            console.log(serialPacket);
            console.log(serialPacket.getFormattedPacket());
            console.log(String.fromCharCode(...serialPacket.getFormattedPacket()));

            targetDevice.serialWrite(String.fromCharCode(...serialPacket.getFormattedPacket()));
        } catch(e) {
            console.log(e);

            serialPacket.clear();
            serialPacket.request_type &= ~RequestStatus.REQUEST_STATUS_OK;
            serialPacket.request_type |= RequestStatus.REQUEST_STATUS_ERROR;
            targetDevice.serialWrite(String.fromCharCode(...serialPacket.getFormattedPacket()));
        }
    });

    return target.connect()
        .then(() => {
            setStatus("Connected to " + (device.productName != "" ? device.productName : "micro:bit"));
            target.setSerialBaudrate(baud); // set the baud rate after connecting

            return target.getSerialBaudrate();
        })
        .then(baud => {
            target.startSerialRead(200);
            console.log(`Listening at ${baud} baud...`);
            targetDevice = target;
        });
}

/***
 * Sets the status text displayed under the micro:bit to the msg parameter.
 *
 * @param msg The message to set the status text to
 */
function setStatus(msg: string) {
    statusText.text(msg);
}

/***Event handlers***/
connectButton.on('click', () => {
    if(connectButton.text() == "Connect") {
        connectButton.text("Disconnect");

        selectDevice();
    } else {
        connectButton.text("Connect");
        setStatus(DEFAULT_STATUS);

        targetDevice.disconnect();
        targetDevice.stopSerialRead();
    }
});

flashButton.on('click', () => {
   console.log(hub_variables);

   let jsonData = {
       "namespace": "test",
       "name": "testttt",
       "type": 0,
       "unit": "c",
       "value": 0
   };

   let headers = {"school-id": hub_variables["credentials"]["school_id"], "pi-id": hub_variables["credentials"]["pi_id"]};

    $.ajax({
        type: "POST",
        dataType: "json",
        url: "http://localhost:3000/proxy/POST/?url=https://energyinschools.co.uk/api/v1/micro-bit/historical-data/", //http://localhost:3000/proxy/POST/?url=
        data: jsonData,
        headers: headers,
        success: function(data, body, error){
            console.log("RESPONSE");
            console.log(data);
            console.log(body);
            console.log(error);
        }
    });
});