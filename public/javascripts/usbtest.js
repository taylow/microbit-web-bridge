const connectButton = $('#connect');


connectButton.on('click', () => {
    navigator.usb.requestDevice({
        filters: [{vendorId: 0xD28}]
    })
    .then(device => {
        const transport = new DAPjs.WebUSB(device);
        const target = new DAPjs.DAPLink(transport);

        target.on(DAPjs.DAPLink.EVENT_SERIAL_DATA, data => {
            console.log(data + " - (" + data.length + ")");

        });

        return target.connect()
            .then(() => target.setSerialBaudrate(115200))
            .then(() => target.startSerialRead());
    })
    .catch(error => {
        console.error(error.message || error);
    });
});

