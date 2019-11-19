import $ = require('jquery');


export function terminalMsg(message: any) {
    const terminal = $('#terminal-contents');
    const terminalMsg = `[${new Date().toISOString().slice(11,-5)}] ${message}`;
    terminal.text(`${terminal.text()}${terminalMsg}\n`);
    terminal.scrollTop(terminal[0].scrollHeight)
}