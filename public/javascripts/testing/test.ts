import * as $ from "jquery";
import { WebUSB } from 'dapjs/lib/transport/webusb';
import { DAPLink } from 'dapjs/lib/daplink';

const BAUD_RATE = 115200;

const connectButton = $('#connect');
const sendButton = $('#send');

let bridge;

connectButton.on("click", () => {
    selectDevice();
})

function selectDevice() {
    navigator.usb.requestDevice({
        filters: [{vendorId: 0xD28}]
    })
    .then(device => {
        connectDevice(device, BAUD_RATE);
    })
    .catch(error => {
        console.log(error);
    });
}

function connectDevice(device: any, baud: number) {
    const transport = new WebUSB(device);
    const target = new DAPLink(transport);

    navigator.usb.addEventListener("disconnect", () => {
       console.log("Disconnected");
       target.startSerialRead();
       target.disconnect();
    });

    target.on(DAPLink.EVENT_SERIAL_DATA, data => {
        console.log("Received: " + data.trim());
    });

    return target.connect()
        .then(() => {
            target.setSerialBaudrate(baud);
            return target.getSerialBaudrate();
        })
        .then(baud => {
            target.startSerialRead();
            console.log(`Listening at ${baud} baud...`);
            bridge = target;
        });
}

sendButton.on("click", () => {
    bridge.serialWrite("TEST\n");
    console.log("Sending test");
})