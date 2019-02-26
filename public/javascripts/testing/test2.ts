import * as $ from "jquery";
import { DAPLink } from 'dapjs/lib/daplink';
import { WebUSB } from 'dapjs/lib/transport/webusb';

let dev;

console.log(DAPLink.EVENT_SERIAL_DATA);

$('#connect').on("click", () => {
    navigator.usb.requestDevice({
        filters: [{vendorId: 0xD28}]
    })
    .then(device => {
        const transport = new WebUSB(device);
        const daplink = new DAPLink(transport);

        return daplink.connect()
            .then(() => {
                daplink.setSerialBaudrate(115200);
            })
            .then(() => {
                daplink.startSerialRead();
            })
            .then(() => {
                daplink.serialWrite("TEST");
            })
            .then(() => {
                dev = daplink;
            });
    })
    .catch(error => {
        console.error(error.message || error);
    });
});

$('#send').on("click", () => {
    dev.serialWrite("TESTTTTTTTT");
});