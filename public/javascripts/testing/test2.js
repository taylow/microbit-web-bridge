"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $ = require("jquery");
var daplink_1 = require("dapjs/lib/daplink");
var webusb_1 = require("dapjs/lib/transport/webusb");
var dev;
console.log(daplink_1.DAPLink.EVENT_SERIAL_DATA);
$('#connect').on("click", function () {
    navigator.usb.requestDevice({
        filters: [{ vendorId: 0xD28 }]
    })
        .then(function (device) {
        var transport = new webusb_1.WebUSB(device);
        var daplink = new daplink_1.DAPLink(transport);
        return daplink.connect()
            .then(function () {
            daplink.setSerialBaudrate(115200);
        })
            .then(function () {
            daplink.startSerialRead();
        })
            .then(function () {
            daplink.serialWrite("TEST");
        })
            .then(function () {
            dev = daplink;
        });
    })
        .catch(function (error) {
        console.error(error.message || error);
    });
});
$('#send').on("click", function () {
    dev.serialWrite("TESTTTTTTTT");
});
//# sourceMappingURL=test2.js.map