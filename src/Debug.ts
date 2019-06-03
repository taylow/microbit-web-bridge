import $ = require('jquery');
import {DEBUG, TIMESTAMPS} from "./constants/Config";


export enum DebugType {
    ERROR = "ERROR",
    DEBUG = "DEBUG",
    WARNING = "WARNING"
}

export function debug(message: any, type?: DebugType) {
    const terminal = $('#terminal-contents');

    let consoleString = "";
    let terminalString = "";

    if(TIMESTAMPS) {
        consoleString += `[${new Date().toISOString().slice(11,-5)}] `;
        terminalString = consoleString;
    }

    if(type != null) {
        consoleString += `${type}: `;
    }

    if(DEBUG) {
        consoleString += message;
        terminalString += message;
        console.log(consoleString);
    }

    terminal.text(`${terminal.text()}${terminalString}\n`);
    terminal.scrollTop(terminal[0].scrollHeight)
}