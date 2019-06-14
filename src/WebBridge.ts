import $ = require('jquery');
import {DAPLink} from 'dapjs/lib/daplink';
import {WebUSB} from 'dapjs/lib/transport/webusb';
import {terminalMsg} from "./Debug";
import {SerialHandler} from "./SerialHandler";
import AuthAPIService from "./api/login";
import HubsAPIService from "./api/hubs";
import logger from "../libs/logger";

const DEFAULT_BAUD = 115200;
const FLASH_PAGE_SIZE = 59;
const DEFAULT_TRANSLATION_POLLING = 60000;
const DEFAULT_STATUS = "Connect to a micro:bit to start the hub";

const statusText = $('#status');
const connectButton = $('#connect');
const flashButton = $('#flash');
const loginButton = $('#loginButton');
const logoutButton = $('#logout');
const hubsSelect = $('#hubSelect');

const s = require('../stylesheets/style.css'); //css TODO replace

let targetDevice: DAPLink;
let serialNumber: string;
let serialHandler: SerialHandler;
let selectedHubUID: string = "-1";

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
        //"url": "https://raw.githubusercontent.com/Taylor-Woodcock/microbit-web-bridge/master/translations.json",
        "url": "translations.json",
        "poll_updates": false,
        "poll_time": DEFAULT_TRANSLATION_POLLING,
        "json": {}
    },
    "proxy": {
        "address": "/proxy", //"https://scc-tw.lancs.ac.uk/proxy",
        "proxy_requests": true
    },
    "dapjs": {
        "serial_delay": 150,
        "baud_rate": 115200,
        "flash_timeout": 5000,
        "reset_pause": 1000
    }
};

/***
 * Downloads translations from the url stored in the hub_variables JSON.
 */
async function getTranslations() {
    // if poll_updates is false and we haven't already grabbed the translations file, return
    if (!hub_variables["translations"]["poll_updates"] && Object.entries(hub_variables["translations"]["json"]).length !== 0)
        return;

    terminalMsg("Checking for translations updates");
    logger.info("Checking for translations updates");

    $.ajax({
        url: hub_variables["translations"]["url"],
        method: 'GET',
        dataType: 'JSON',
        cache: false,
        timeout: 10000,
        error: (error) => {
            terminalMsg(`Error receiving translations`);
            logger.error(error);
        },
        success: (response) => {
            if (hub_variables["translations"]["json"] == {} || response["version"] != hub_variables["translations"]["json"]["version"]) {
                terminalMsg(`Translations have updated! (v${response["version"]})`);
                hub_variables["translations"]["json"] = response;
            }
        }
    });

    // poll the translations file for updates periodically
    setTimeout(getTranslations, hub_variables["translations"]["poll_time"]);
}

getTranslations();

/***
 * Opens option to choose a webUSB device filtered using micro:bit's vendor ID.
 */
function selectDevice(): Promise<USBDevice> {
    setStatus("Select a device");

    return new Promise((resolve, reject) => {
        navigator.usb.requestDevice({
            filters: [{vendorId: 0x0d28, productId: 0x0204}]
        }).then((device) => {
            resolve(device);
        })
            .catch((error) => {
                reject(error);
            });
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
                logger.error(e);
                logger.error(ERROR_MESSAGE);
            });
    } catch (e) {
        logger.error(e);
        logger.error(ERROR_MESSAGE);
    }

    targetDevice = null; // destroy DAPLink
}

/**
 * Connect to given device and add listeners for receiving and disconnections.
 *
 * @param device WebUSB micro:bit instance
 * @returns {PromiseLike<string>}
 */
function connect(device: USBDevice): Promise<string> {
    return new Promise((resolve, reject) => {
        if (targetDevice) targetDevice.stopSerialRead();

        // Connect to device
        const transport = new WebUSB(device);
        targetDevice = new DAPLink(transport);
        serialNumber = device.serialNumber;

        // Ensure disconnected
        targetDevice.disconnect();

        targetDevice.connect()
            .then(() => targetDevice.setSerialBaudrate(hub_variables.dapjs.baud_rate))
            .then(() => targetDevice.getSerialBaudrate())
            .then(baud => {
                targetDevice.startSerialRead(hub_variables.dapjs.serial_delay);
                logger.info(`Listening at ${baud} baud...`);
                serialHandler = new SerialHandler(targetDevice, hub_variables, baud);
                resolve("Connected to " + (device.productName != "" ? device.productName : "micro:bit"));
            })
            .catch(err => {
                logger.error(err);
                reject(`Failed to connect : ${err}`);
            });
    });
}

function flashDevice(device: USBDevice): Promise<string> {
    return new Promise((resolve, reject) => {
        hub_variables["authenticated"] = false;
        hub_variables["school_id"] = "";
        hub_variables["pi_id"] = "";

        if (targetDevice) targetDevice.stopSerialRead();

        HubsAPIService.getHubFirmware(selectedHubUID).then((firmware: ArrayBuffer) => {
            // Connect to device
            const transport = new WebUSB(device);
            targetDevice = new DAPLink(transport);

            // Ensure disconnected
            targetDevice.disconnect();

            // Event to monitor flashing progress
            targetDevice.on(DAPLink.EVENT_PROGRESS, function (progress) {
                setStatus(`Flashing: ${Math.round(progress * 100)}%`)
            });

            // Push binary to board
            return targetDevice.connect()
                .then(() => {
                    logger.info("Flashing");
                    return targetDevice.flash(firmware);
                })
                .then(() => {
                    logger.info("Finished flashing! Reconnect micro:bit");
                    resolve("Finished flashing! Reconnect micro:bit");
                    return targetDevice.disconnect();
                })
                .catch((e) => {
                    reject("Error flashing: " + e);
                    logger.error("Error flashing: " + e);
                })
        }).catch(() => {
            reject("Failed to get hub firmware")
        })
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

/*
 *
 * -------- E V E N T   H A N D L E R S --------
 *
 */


/***
 * Event handler for handling when a USB device is unplugged.
 */
navigator.usb.addEventListener('disconnect', (device) => {
    // check if the bridging micro:bit is the one that was disconnected
    if (device.device.serialNumber == serialNumber)
        disconnect();
});

/***
 * Event handler for clicking the connect/disconnect button.
 *
 * If not connected, this event handler will trigger the WebUSB popup for connecting
 * to a micro:bit. Once selected, a connection with the micro:bit should be made and communication
 * can commence.
 */
connectButton.on('click', () => {
    if (connectButton.text() == "Connect") {
        selectDevice()
            .then((device: USBDevice) => {
                setStatus("Connecting...");
                return connect(device);
            })
            .then((message) => {
                connectButton.text("Disconnect");
                setStatus(message);
            })
            .catch((error) => {
                setStatus(error);
            });
    } else {
        disconnect();
    }
});

/***
 * Event handler for clicking the flash button.
 *
 * Upon pressing, this button will flash the micro:Bit with the hex file generated from the portal.
 */
flashButton.on('click', () => {
    if (selectedHubUID === '-1') {
        alert("Hub firmware should be selected!");
        return
    }

    selectDevice()
        .then((device: USBDevice) => {
            return flashDevice(device)
        })
        .then((message) => {
            setStatus(message);
        })
        .catch((error) => {
            setStatus(error);
        });
});

/**
 * Logout button click handler
 */
logoutButton.on('click', () => {
    AuthAPIService.cleanTokens();
    window.location.reload()
});

/**
 * Login button click handler
 */
loginButton.on('click', () => {
    const data = {
        username: $('#userName').val().toString(),
        password: $('#inputPassword').val().toString()
    };
    AuthAPIService.login(data.username, data.password).then(() => {
        window.location.reload()
    }).catch((error) => {
        $('#loginError').show();
        $('#loginError').text(error.message);
    });
});

hubsSelect.on('change', function () {
    selectedHubUID = (this as HTMLInputElement).value;
});

/**
 * Show/hide main content based on token availability
 * TODO: use router library to handle it properly
 */
window.onload = () => {
    if (AuthAPIService.AccessToken) {
        $('#loginpage').hide();
        $('#main').show();
        HubsAPIService.getWebHubs().then((hubs) => {
            for (const hub of hubs) {
                hubsSelect.append(`<option value='${hub.uid}'>${hub.name}</option>`);
            }
        })
    } else {
        $('#loginpage').show();
        $('#main').hide();
    }

    // TODO: temporarily overwritten for localhost development
    //$('#loginpage').hide();
    //$('#main').show();
};