"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $ = require("jquery");
var DEBUG = true;
var DebugType;
(function (DebugType) {
    DebugType["ERROR"] = "ERROR";
    DebugType["DEBUG"] = "DEBUG";
    DebugType["WARNING"] = "WARNING";
})(DebugType = exports.DebugType || (exports.DebugType = {}));
function debug(message, type) {
    var terminal = $('#terminal-contents');
    if (DEBUG && type != null) {
        console.log(type + ": " + message);
        terminal.text(terminal.text() + message + '\n');
        return;
    }
    else if (DEBUG) {
        console.log("" + message);
    }
    terminal.text(terminal.text() + message + '\n');
}
exports.debug = debug;
//# sourceMappingURL=Debug.js.map