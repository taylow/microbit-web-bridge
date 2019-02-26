import * as $ from "jquery";

const DEBUG = true;

export enum DebugType {
    ERROR = "ERROR",
    DEBUG = "DEBUG",
    WARNING = "WARNING"
}

export function debug(message: any, type?: DebugType) {
    const terminal = $('#terminal-contents');

    if(DEBUG && type != null) {
        console.log(`${type}: ${message}`);
        terminal.text(terminal.text() + message + '\n');
        return;
    } else if(DEBUG) {
        console.log(`${message}`);
    }

    terminal.text(terminal.text() + message + '\n');
}