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
const $ = require("jquery");
const daplink_1 = require("dapjs/lib/daplink");
const webusb_1 = require("dapjs/lib/transport/webusb");
const Debug_1 = require("./Debug");
const SerialHandler_1 = require("./SerialHandler");
const login_1 = require("./api/login");
const DEFAULT_BAUD = 115200;
const DEFAULT_TRANSLATION_POLLING = 60000;
const DEFAULT_STATUS = "Connect to a micro:bit and flash the bridging software";
const statusText = $('#status');
const connectButton = $('#connect');
const flashButton = $('#flash');
const loginButton = $('#loginButton');
const logoutButton = $('#logout');
let targetDevice;
let serialNumber;
let serialHandler;
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
        "address": "/proxy",
        "proxy_requests": true
    }
};
/***
 * Downloads translations from the url stored in the hub_variables JSON.
 */
function getTranslations() {
    return __awaiter(this, void 0, void 0, function* () {
        // if poll_updates is false and we haven't already grabbed the translations file, return
        if (!hub_variables["translations"]["poll_updates"] && Object.entries(hub_variables["translations"]["json"]).length !== 0)
            return;
        Debug_1.debug("Checking for translations updates", Debug_1.DebugType.DEBUG);
        $.ajax({
            url: hub_variables["translations"]["url"],
            method: 'GET',
            dataType: 'JSON',
            cache: false,
            timeout: 10000,
            error: () => {
                Debug_1.debug(`Error receiving translations`, Debug_1.DebugType.ERROR);
            },
            success: (response) => {
                if (hub_variables["translations"]["json"] == {} || response["version"] != hub_variables["translations"]["json"]["version"]) {
                    Debug_1.debug(`Translations have updated! (v${response["version"]})`, Debug_1.DebugType.DEBUG);
                    hub_variables["translations"]["json"] = response;
                }
            }
        });
        setTimeout(getTranslations, hub_variables["translations"]["poll_time"]);
    });
}
getTranslations();
/***
 * Opens option to choose a webUSB device filtered using micro:bit's vendor ID.
 */
function selectDevice() {
    setStatus("Select a device");
    navigator.usb.requestDevice({
        filters: [{ vendorId: 0xD28 }]
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
function connect(device, baud) {
    setStatus("Connecting...");
    const transport = new webusb_1.WebUSB(device);
    const target = new daplink_1.DAPLink(transport);
    // create a SerialHandler to handle all serial communication
    serialHandler = new SerialHandler_1.SerialHandler(target, hub_variables, baud);
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
    }
    catch (e) {
        console.log(ERROR_MESSAGE);
    }
    targetDevice = null; // destroy DAPLink
}
/***
 * Sets the status text displayed under the micro:bit to the msg parameter.
 *
 * @param msg The message to set the status text to
 */
function setStatus(msg) {
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
    }
    else {
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
    if (device.device.serialNumber == serialNumber)
        disconnect();
});
/**
 * Login button click handler
 */
loginButton.on('click', () => {
    const data = {
        username: $('#userName').val().toString(),
        password: $('#inputPassword').val().toString()
    };
    login_1.default.login(data.username, data.password).then(() => {
        window.location.reload();
    }).catch((error) => {
        $('#loginError').show();
        $('#loginError').text(error.message);
    });
});
logoutButton.on('click', () => {
    login_1.default.cleanTokens();
    window.location.reload();
});
/**
 * Show/hide main content based on token availability
 * TODO: use router library to handle it properly
 */
window.onload = () => {
    if (login_1.default.AccessToken) {
        $('#loginpage').hide();
        $('#main').show();
    }
    else {
        $('#loginpage').show();
        $('#main').hide();
    }
};
//# sourceMappingURL=WebBridge.js.map