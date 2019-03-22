import * as $ from "jquery";
import {DAPLink} from 'dapjs/lib/daplink';
import {WebUSB} from 'dapjs/lib/transport/webusb';
import {debug, DebugType} from "./Debug";
import {SerialHandler} from "./SerialHandler";
import {unpack, pack} from 'bufferpack';
import {RequestType, SerialPacket} from "./SerialPacket";

const DEFAULT_BAUD = 115200;
const DEFAULT_TRANSLATION_POLLING = 60000;
const DEFAULT_STATUS = "Connect to a micro:bit and flash the bridging software";

const statusText = $('#status');
const connectButton = $('#connect');
const flashButton = $('#flash');

let targetDevice: DAPLink;
let serialNumber: string;
let serialHandler: SerialHandler;

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
    "translations": {
        //"url": "https://raw.githubusercontent.com/lancaster-university/rest-radio/master/hub/translations.json",
        "url": "/translations",
        "poll_updates": false,
        "poll_time": DEFAULT_TRANSLATION_POLLING,
        "json": {}
    },
    "proxy": {
        "address": "/proxy", //"https://scc-tw.lancs.ac.uk/proxy",
        "proxy_requests": true
    }
};

/***
 * Downloads translations from the url stored in the hub_variables JSON.
 */
async function getTranslations() {
    // if poll_updates is false and we haven't already grabbed the translations file, return
    if(!hub_variables["translations"]["poll_updates"] && Object.entries(hub_variables["translations"]["json"]).length !== 0)
        return;

    debug("Checking for translations updates", DebugType.DEBUG);

    $.ajax({
        url: hub_variables["translations"]["url"],
        method: 'GET',
        dataType: 'JSON',
        cache: false,
        timeout: 10000,
        error: () => {
            debug(`Error receiving translations`, DebugType.ERROR);
        },
        success: (response) => {
            if(hub_variables["translations"]["json"] == {} || response["version"] != hub_variables["translations"]["json"]["version"]) {
                debug(`Translations have updated! (v${response["version"]})`, DebugType.DEBUG);
                hub_variables["translations"]["json"] = response;
            }
        }
    });
    setTimeout(getTranslations, hub_variables["translations"]["poll_time"]);
}

getTranslations();

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

    // create a SerialHandler to handle all serial communication
    serialHandler = new SerialHandler(target, hub_variables, baud);

    return target.connect()
        .then(() => {
            setStatus("Connected to " + (device.productName != "" ? device.productName : "micro:bit"));
            target.setSerialBaudrate(baud); // set the baud rate after connecting
            serialNumber = device.serialNumber; // store serial number for comparison when disconnecting
            return target.getSerialBaudrate();
        })
        .then(baud => {
            target.startSerialRead(200);
            console.log(`Listening at ${baud} baud...`);
            targetDevice = target;
        });
}

/***
 * Disconnects the micro:bit, and resets the front end and hub variables.
 */
function disconnect() {
    const ERROR_MESSAGE = "Couldn't safely disconnect from the micro:bit. This can happen if the micro:bit was unplugged before being disconnected, all is safe!";

    connectButton.text("Connect");
    setStatus(DEFAULT_STATUS);

    // reset hub variables
    hub_variables["authenticated"] = false;
    hub_variables["school_id"] = "";
    hub_variables["pi_id"] = "";

    // destroy SerialHandler
    serialHandler = null;
    serialNumber = "";

    // try to disconnect from the target device
    try {
        targetDevice.removeAllListeners();
        targetDevice.stopSerialRead();
        targetDevice.disconnect()
            .catch((e) => {
                console.log(ERROR_MESSAGE);
            });
    } catch(e) {
        console.log(ERROR_MESSAGE);
    }

    targetDevice = null; // destroy DAPLink
}

/***
 * Sets the status text displayed under the micro:bit to the msg parameter.
 *
 * @param msg The message to set the status text to
 */
function setStatus(msg: string) {
    statusText.text(msg);
}

/*
 *
 * -------- E V E N T   H A N D L E R S --------
 *
 */

/***
 * Event handler for clicking the connect/disconnect button.
 *
 * If not connected, this event handler will trigger the WebUSB popup for connecting
 * to a micro:bit. Once selected, a connection with the micro:bit should be made and communication
 * can commence.
 */
connectButton.on('click', () => {
    if (connectButton.text() == "Connect") {
        connectButton.text("Disconnect");
        selectDevice();
    } else {
        disconnect();
    }
});
let test = 0;
/***
 * Event handler for clicking the flash button.
 *
 * Upon pressing, this button will flash the micro:Bit with the hex file generated from the portal.
 */
flashButton.on('click', () => {
    console.log("Flashing currently not implemented");

    // TODO: Currently using this section for testing, this is where the flashing code will go
    // targetDevice.flash(hexFile);

    /*let serialPacket = new SerialPacket(1, 139, 207, 2);
    let responsePacket = new SerialPacket(1, 139, 207, 2);
    serialPacket.append("/share/historicalData/");
    serialPacket.append("30");
    serialPacket.append("temp");
    serialPacket.append("D22");
    serialPacket.append("c");

    console.log(serialPacket.getFormattedPacket());
    console.log(serialPacket.getFormattedPayloadParts().length);*/

    /*console.log(processRESTRequest(serialPacket, responsePacket, hub_variables["translations"]["json"]["share"], "POST"));*/

    /*RequestHandler.processGETRequest("https://api.carbonintensity.org.uk/generation/")
        .then((response) => {
            console.log(response);
            console.log(response.data);
            console.log(jspath.apply('.data.generationmix.{.fuel == "coal"}.perclel', response.data));
        })
        .catch((error) => {
            console.log(error);
        });*/
});

/***
 * Event handler for handling when a USB device is unplugged.
 */
navigator.usb.addEventListener('disconnect', (device) => {
    // check if the bridging micro:bit is the one that was disconnected
    if(device.device.serialNumber == serialNumber)
        disconnect();
});