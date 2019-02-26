"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $ = require("jquery");
var webusb_1 = require("dapjs/lib/transport/webusb");
var daplink_1 = require("dapjs/lib/daplink");
var BAUD_RATE = 115200;
var connectButton = $('#connect');
var sendButton = $('#send');
var bridge;
connectButton.on("click", function () {
    selectDevice();
});
function selectDevice() {
    navigator.usb.requestDevice({
        filters: [{ vendorId: 0xD28 }]
    })
        .then(function (device) {
        connectDevice(device, BAUD_RATE);
    })
        .catch(function (error) {
        console.log(error);
    });
}
function connectDevice(device, baud) {
    var transport = new webusb_1.WebUSB(device);
    var target = new daplink_1.DAPLink(transport);
    navigator.usb.addEventListener("disconnect", function () {
        console.log("Disconnected");
        target.startSerialRead();
        target.disconnect();
    });
    target.on(daplink_1.DAPLink.EVENT_SERIAL_DATA, function (data) {
        console.log("Received: " + data.trim());
    });
    return target.connect()
        .then(function () {
        target.setSerialBaudrate(baud);
        return target.getSerialBaudrate();
    })
        .then(function (baud) {
        target.startSerialRead();
        console.log("Listening at " + baud + " baud...");
        bridge = target;
    });
}
sendButton.on("click", function () {
    bridge.serialWrite("TEST\n");
    console.log("Sending test");
});
//# sourceMappingURL=test.js.map