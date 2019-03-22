"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const SerialPacket_1 = require("./SerialPacket");
const Debug_1 = require("./Debug");
const axios_1 = require("axios");
class RequestHandler {
    constructor(hub_variables) {
        this.translations = hub_variables["translations"]["json"]; // grab the translations part for easier access
        this.hub_variables = hub_variables;
    }
    /***
     * Handles all requests and forwards the calls onto the correct handler based on the request type.
     *
     * @param serialPacket Incoming serial packet (ALL REQUESTS)
     */
    handleRequest(serialPacket) {
        return __awaiter(this, void 0, void 0, function* () {
            // if HELLO packet
            if (serialPacket.request_type & SerialPacket_1.RequestType.REQUEST_TYPE_HELLO) {
                return this.handleHelloPacket(serialPacket);
                // if a REST request
            }
            else if (serialPacket.getReqRes() & (SerialPacket_1.RequestType.REQUEST_TYPE_GET_REQUEST | SerialPacket_1.RequestType.REQUEST_TYPE_POST_REQUEST)) {
                return this.handleRESTRequest(serialPacket);
                // if a CLOUD variable
            }
            else if (serialPacket.getReqRes() & SerialPacket_1.RequestType.REQUEST_TYPE_CLOUD_VARIABLE) {
                return this.handleCloudVariable(serialPacket);
                // if a BROADCAST request
            }
            else if (serialPacket.getReqRes() & SerialPacket_1.RequestType.REQUEST_TYPE_BROADCAST) {
                return this.handleBroadcast(serialPacket);
            }
            // if any other request type was found, reject it as unrecognised
            return new Promise((resolve, reject) => {
                reject(`Unrecognised packet type (${serialPacket.getReqRes()})`);
            });
        });
    }
    /***
     * Maps a micro:bit query string to a defined query string format and returns
     * it in a list.
     *
     * @param queryString The string to be mapped (comes from the micro:bit)
     * @param queryStringFormat The string format (comes from translations.json)
     */
    mapQueryString(queryString, queryStringFormat) {
        let formatPieces = queryStringFormat.split('/').filter(x => x);
        let queryPieces = queryString.split('/').filter(x => x);
        let root = queryPieces[0];
        let regexp = new RegExp("%(.*)%"); // regex that will find all %strings%
        let out = [];
        out['service'] = root; // set the service we are using to the first element (e.g. carbon, share, etc.)
        queryPieces.shift(); // shift pieces over after getting root
        root = queryPieces[0]; // get first piece
        // loop through the pieces in the query format (split by /)
        for (let format of formatPieces) {
            let name = regexp.exec(format);
            let key = name[1];
            // if it is an optional attribute
            if (key[key.length - 1] == '?') {
                if (root == "")
                    break;
                key = key.substr(0, key.length - 1); // remove the ? from the attribute name
            }
            out[key] = root; // set the key and value in the output list
            if (queryPieces.length == 0) {
                root = "";
                continue;
            }
            queryPieces.shift();
            root = queryPieces[0]; // set the root to the first element
        }
        return out;
    }
    processRESTRequest(serialPacket, responsePacket, translation, requestType) {
        return new Promise((resolve, reject) => {
            try {
                // console.log(translation);
                // gets the format for the micro:bit query string
                let mbQueryString = translation[requestType]["microbitQueryString"]; // get microbitQueryString from translation
                // console.log(mbQueryString);
                // maps the query string coming from the micro:bit to the translated format
                let queryStrMap = this.mapQueryString(serialPacket.get(0), mbQueryString);
                // console.log(queryStrMap);
                // gets the baseURL for the specified service
                let baseURL = translation[requestType]["baseURL"];
                // console.log(baseURL);
                // gets the endpoint json
                let endpoint = translation[requestType]["endpoint"][queryStrMap["endpoint"]];
                // console.log(endpoint);
                // gets the queryObject for the specified endpoint
                let queryObject = endpoint["queryObject"];
                // if there was no query object, set it to blank
                if (queryObject == null)
                    queryObject = [];
                // console.log(queryObject);
                // regex for finding url parts (e.g. api_endpoint, etc)
                let urlPart;
                let regexp = new RegExp("%([^%]*)%", "g"); //"(?=\\w*%)%*\\w+%*");
                let newURL = baseURL;
                // loop through the URL and replace any % surrounded url parts with their queryObject counterparts
                while ((urlPart = regexp.exec(baseURL)) !== null) {
                    // grab the default parameter from the URL
                    let sectionParts = urlPart[1].split("?=");
                    if (sectionParts[0] in queryObject) {
                        // if there is a queryObject part, replace it with the value
                        newURL = newURL.replace(urlPart[0], queryObject[sectionParts[0]]);
                    }
                    else if (sectionParts.length > 1) {
                        // if there is a default, set it to it
                        newURL = newURL.replace(urlPart[0], sectionParts[1]);
                    }
                    else {
                        // if none of the above, replace with nothing
                        newURL = newURL.replace(urlPart[0], "");
                    }
                }
                Debug_1.debug(`Service: ${queryStrMap["service"].toUpperCase()}`, Debug_1.DebugType.DEBUG);
                let headers = {
                    "school-id": this.hub_variables["credentials"]["school_id"],
                    "pi-id": this.hub_variables["credentials"]["pi_id"],
                    "content-type": "application/json"
                };
                //TODO: Temporary hardcoded parts for temporary functionality. This will be replaced with the translations
                /*switch(queryStrMap["service"]) {
                    case "share":
                        console.log("SHARE");

                        if(queryStrMap["endpoint"] == "fetchData") {
                            try{
                                axios.get(`${this.hub_variables["proxy"]["address"]}/GET/?url=${newURL}${queryStrMap["unit"]}`, {headers: headers})
                                    .then((success) => {
                                        responsePacket.append(`${JSON.parse(success.data.body)["value"]}`);
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        console.log("ERROR" + error);
                                        reject("COULD NOT GET VARIABLE");
                                        return;
                                    });
                            } catch(e) {
                                reject("COULD NOT GET VARIABLE");
                            }
                        } else if(queryStrMap["endpoint"] == "shareData") {
                            try {
                                let jsonData = {
                                    "key": serialPacket.get(2),
                                    "value": serialPacket.get(1),
                                    "share_with": (serialPacket.get(3) ? "SCHOOL" : "ALL") //FIXME: For some reason this value is always 0 from the micro:bit
                                };

                                axios.post(`${this.hub_variables["proxy"]["address"]}/POST/?url=${newURL}${serialPacket.get(2)}`, jsonData, {headers: headers})
                                    .then((success) => {
                                        responsePacket.append("DATA SENT");
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        reject("COULD NOT SHARE DATA");
                                    });
                            } catch(e) {
                                reject("COULD NOT SHARE DATA");
                            }
                        } else if(queryStrMap["endpoint"] == "historicalData") {
                            try {
                                let jsonData = {
                                    "namespace": serialPacket.get(3),
                                    "name": serialPacket.get(2),
                                    "type": 0,
                                    "unit": serialPacket.get(4),
                                    "value": Number(serialPacket.get(1))
                                };

                                axios.post(`${this.hub_variables["proxy"]["address"]}/POST/?url=${newURL}`, jsonData, {headers: headers})
                                    .then((success) => {
                                        responsePacket.append("DATA SENT");
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        reject("COULD NOT SHARE DATA");
                                    });
                            } catch(e) {
                                reject("COULD NOT SHARE DATA");
                            }
                        }
                        break;

                    case "init":
                    case "iot":
                    case "energy":
                    case "energyMeter":
                    case "weather":
                    case "carbon":
                    case "iss":
                        reject(`Unimplimented service`);
                        break;

                    default:
                        reject(`Unknown service ${queryStrMap["service"]}`);
                }*/
            }
            catch (e) {
                console.log(e);
                reject("REST REQUEST ERROR");
            }
            // responsePacket.request_type |= RequestStatus.REQUEST_STATUS_OK;
            // resolve(responsePacket);
        });
    }
    /***
     * Handles REST requests and gathers the correct translations and data needed to process the REST request.
     *
     * @param serialPacket Incoming serial packet (REST REQUEST)
     */
    handleRESTRequest(serialPacket) {
        Debug_1.debug(`REST REQUEST PACKET`, Debug_1.DebugType.DEBUG);
        try {
            let responsePacket = new SerialPacket_1.SerialPacket(serialPacket.getAppID(), serialPacket.getNamespaceID(), serialPacket.getUID());
            let queryPieces = serialPacket.get(0).split('/').filter(x => x);
            let root = queryPieces[0];
            queryPieces.shift(); // shift pieces over after getting root
            // check if the endpoint is in the translations
            if (!(root in this.translations)) {
                //TODO: utilise promises more and reject the errors instead
                return new Promise((resolve, reject) => {
                    reject(`INVALID SERVICE (${root})`);
                });
            }
            // get translation for endpoint
            let translation = this.translations[root];
            let requestType;
            // decode request type (GET or POST)
            if (serialPacket.getReqRes() & SerialPacket_1.RequestType.REQUEST_TYPE_GET_REQUEST) {
                requestType = "GET";
                responsePacket.request_type |= SerialPacket_1.RequestType.REQUEST_TYPE_GET_REQUEST;
            }
            else if (serialPacket.getReqRes() & SerialPacket_1.RequestType.REQUEST_TYPE_POST_REQUEST) {
                requestType = "POST";
                responsePacket.request_type |= SerialPacket_1.RequestType.REQUEST_TYPE_POST_REQUEST;
            }
            else {
                return new Promise((resolve, reject) => {
                    reject("INVALID REQUEST TYPE");
                });
            }
            return this.processRESTRequest(serialPacket, responsePacket, translation, requestType);
        }
        catch (e) {
            console.log(e);
            return new Promise((resolve, reject) => {
                reject("REST PACKET ERROR");
            });
        }
    }
    /***
     * Currently unimplimented.
     * TODO: Implement cloud variables
     *
     * @param serialPacket Incoming serial packet (CLOUD VARIABLE)
     */
    handleCloudVariable(serialPacket) {
        return new Promise((resolve, reject) => {
            reject("CLOUD UNIMPLEMENTED");
        });
    }
    /***
     * Currently unimplimented.
     * TODO: Implement broadcast
     *
     * @param serialPacket Incoming serial packet (CLOUD VARIABLE)
     */
    handleBroadcast(serialPacket) {
        return new Promise((resolve, reject) => {
            reject("BROADCAST UNIMPLEMENTED");
        });
    }
    /***
     * Handles the Hello packet that is sent from the bridging micro:bit upon initialised connection.
     * An "OK" response is returned.
     *
     * @param serialPacket Incoming serial packet (HELLO PACKET)
     */
    handleHelloPacket(serialPacket) {
        return new Promise((resolve, reject) => {
            Debug_1.debug(`HELLO PACKET`, Debug_1.DebugType.DEBUG);
            Debug_1.debug(`School_ID: ${serialPacket.get(1)} hub_id: ${serialPacket.get(2)}`, Debug_1.DebugType.DEBUG);
            let responsePacket = new SerialPacket_1.SerialPacket(serialPacket.getAppID(), serialPacket.getNamespaceID(), serialPacket.getUID());
            // if the hub has already been authenticated with a hello packet, return error
            if (this.hub_variables["authenticated"]) {
                reject("ALREADY AUTHENTICATED");
                return;
            }
            // if the school ID is blank
            if (!serialPacket.get(1)) {
                reject("BAD SCHOOL ID");
                return;
            }
            // if the hub ID is blank
            if (!serialPacket.get(1)) {
                reject("BAD HUB ID");
                return;
            }
            // set hub variables pi_id and school_id and set authenticate to true
            this.hub_variables["credentials"]["school_id"] = serialPacket.get(1);
            this.hub_variables["credentials"]["pi_id"] = serialPacket.get(2);
            this.hub_variables["authenticated"] = true;
            // set request type to hello and status to OK
            responsePacket.setRequestBit(SerialPacket_1.RequestType.REQUEST_TYPE_HELLO);
            responsePacket.setRequestBit(SerialPacket_1.RequestStatus.REQUEST_STATUS_OK);
            responsePacket.append(0); // append a 0 for OK
            resolve(responsePacket); // resolve the response packet to be sent to the bridge micro:bit
        });
    }
    /***
     * Makes a GET request to the given URL and return its JSON response.
     *
     * @param url URL to make request
     * @param config Config for axios request
     */
    static processGETRequest(url, config) {
        return axios_1.default.get(url, config);
        /*return new Promise((resolve, reject) => {
            reject(`Invalid Service (${root})`);
        });*/
    }
    /***
     * Makes a POST request to the given URL and return its response.
     *
     * @param url URL to make request
     * @param config Config for axios request
     */
    processPOSTRequest(url, config) {
        return new Promise((resolve, reject) => {
            reject(``);
        });
    }
}
exports.RequestHandler = RequestHandler;
//# sourceMappingURL=RequestHandler.js.map