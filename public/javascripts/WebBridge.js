"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $ = require("jquery");
var daplink_1 = require("dapjs/lib/daplink");
var webusb_1 = require("dapjs/lib/transport/webusb");
var Debug_1 = require("./Debug");
var RequestHandler_1 = require("./RequestHandler");
var SerialPacket_1 = require("./SerialPacket");
var DEFAULT_BAUD = 115200;
var DEFAULT_STATUS = "Connect to a micro:bit and flash the bridging software";
var statusText = $('#status');
var connectButton = $('#connect');
var flashButton = $('#flash');
var targetDevice;
var translations;
var packetCount = 0;
var hub_variables = {
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
        error: function () {
            Debug_1.debug("Error receiving translations", Debug_1.DebugType.ERROR);
            return false;
        },
        success: function (response) {
            return response;
        }
    });
}
$.when(getTranslations()).done(function (translations) {
    hub_variables.translations_json = translations;
    Debug_1.debug("Translations downloaded", Debug_1.DebugType.DEBUG);
});
/***
 * Opens option to choose a webUSB device filtered using micro:bit's vendor ID.
 */
function selectDevice() {
    setStatus("Select a device");
    navigator.usb.requestDevice({
        filters: [{ vendorId: 0xD28 }]
    })
        .then(function (device) {
        connect(device, DEFAULT_BAUD);
    })
        .catch(function (error) {
        setStatus(error);
    });
}
/***
 * Converts raw data into a SerialPacket for easy processing
 *
 * @param data Raw serial data coming from the bridging micro:bit
 */
function dataToSerialPacket(data) {
    var payload = [];
    //TODO: this doesn't decode SLIP, only removes the last character (len - 1)
    for (var i = 5; i < data.length - 1; i++) {
        payload.push(data.charCodeAt(i));
    }
    return new SerialPacket_1.SerialPacket(data.charCodeAt(1), data.charCodeAt(2), data.charCodeAt(3), data.charCodeAt(4), payload);
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
    var transport = new webusb_1.WebUSB(device);
    var target = new daplink_1.DAPLink(transport);
    navigator.usb.addEventListener('disconnect', function () {
        setStatus("Disconnected");
        target.stopSerialRead();
        target.disconnect();
        connectButton.text("Connect");
    });
    target.on(daplink_1.DAPLink.EVENT_SERIAL_DATA, function (data) {
        //TODO: Use Web Workers to move these into a new thread
        packetCount++;
        console.log("Received (" + packetCount + "): " + data);
        // debug stuff TODO: remove
        var dataBytes = [];
        for (var i = 0; i < data.length; i++) {
            dataBytes.push(data.charCodeAt(i)); // push the byte value onto dataByte array
        }
        console.log(dataBytes);
        var serialPacket;
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
            var requestHandler = new RequestHandler_1.RequestHandler(hub_variables.translations_json, hub_variables);
            serialPacket = dataToSerialPacket(data);
            //typedWorker.postMessage({ serialPacket: serialPacket, requestHandler: requestHandler }); // pass the serial packet and request handler to the web worker
            serialPacket = requestHandler.handleRequest(serialPacket);
            console.log(serialPacket);
            console.log(serialPacket.getFormattedPacket());
            console.log(String.fromCharCode.apply(String, serialPacket.getFormattedPacket()));
            targetDevice.serialWrite(String.fromCharCode.apply(String, serialPacket.getFormattedPacket()));
        }
        catch (e) {
            console.log(e);
            serialPacket.clear();
            serialPacket.request_type &= ~128 /* REQUEST_STATUS_OK */;
            serialPacket.request_type |= 64 /* REQUEST_STATUS_ERROR */;
            targetDevice.serialWrite(String.fromCharCode.apply(String, serialPacket.getFormattedPacket()));
        }
    });
    return target.connect()
        .then(function () {
        setStatus("Connected to " + (device.productName != "" ? device.productName : "micro:bit"));
        target.setSerialBaudrate(baud); // set the baud rate after connecting
        return target.getSerialBaudrate();
    })
        .then(function (baud) {
        target.startSerialRead(200);
        console.log("Listening at " + baud + " baud...");
        targetDevice = target;
    });
}
/***
 * Sets the status text displayed under the micro:bit to the msg parameter.
 *
 * @param msg The message to set the status text to
 */
function setStatus(msg) {
    statusText.text(msg);
}
/***Event handlers***/
connectButton.on('click', function () {
    if (connectButton.text() == "Connect") {
        connectButton.text("Disconnect");
        selectDevice();
    }
    else {
        connectButton.text("Connect");
        setStatus(DEFAULT_STATUS);
        targetDevice.disconnect();
        targetDevice.stopSerialRead();
    }
});
flashButton.on('click', function () {
    console.log(hub_variables);
    var jsonData = {
        "namespace": "test",
        "name": "testttt",
        "type": 0,
        "unit": "c",
        "value": 0
    };
    var headers = { "school-id": hub_variables["credentials"]["school_id"], "pi-id": hub_variables["credentials"]["pi_id"] };
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "http://localhost:3000/proxy/POST/?url=https://energyinschools.co.uk/api/v1/micro-bit/historical-data/",
        data: jsonData,
        headers: headers,
        success: function (data, body, error) {
            console.log("RESPONSE");
            console.log(data);
            console.log(body);
            console.log(error);
        }
    });
});
//# sourceMappingURL=WebBridge.js.map