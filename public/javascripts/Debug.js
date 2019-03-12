"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $ = require("jquery");
const DEBUG = true;
const TIMESTAMPS = true;
var DebugType;
(function (DebugType) {
    DebugType["ERROR"] = "ERROR";
    DebugType["DEBUG"] = "DEBUG";
    DebugType["WARNING"] = "WARNING";
})(DebugType = exports.DebugType || (exports.DebugType = {}));
function debug(message, type) {
    const terminal = $('#terminal-contents');
    let consoleString = "";
    let terminalString = "";
    if (TIMESTAMPS) {
        consoleString += `[${new Date().toISOString().slice(11, -5)}] `;
        terminalString = consoleString;
    }
    if (type != null) {
        consoleString += `${type}: `;
    }
    if (DEBUG) {
        consoleString += message;
        terminalString += message;
        console.log(consoleString);
    }
    terminal.text(`${terminal.text()}${terminalString}\n`);
    terminal.scrollTop(terminal[0].scrollHeight);
}
exports.debug = debug;
//# sourceMappingURL=Debug.js.map