import * as jspath from "jspath";
import {RequestStatus, RequestType, SerialPacket} from "./SerialPacket";
import {debug, DebugType} from "./Debug";
import axios, {AxiosRequestConfig} from "axios";

export class RequestHandler {
    private readonly translations;
    private readonly hub_variables;

    constructor(hub_variables: {}) {
        this.translations = hub_variables["translations"]["json"]; // grab the translations part for easier access
        this.hub_variables = hub_variables;
    }

    /***
     * Handles all requests and forwards the calls onto the correct handler based on the request type.
     *
     * @param serialPacket Incoming serial packet (ALL REQUESTS)
     */
    public async handleRequest(serialPacket: SerialPacket): Promise<SerialPacket> {
        // if HELLO packet
        if (serialPacket.request_type & RequestType.REQUEST_TYPE_HELLO) {
            return this.handleHelloPacket(serialPacket);

            // if a REST request
        } else if (serialPacket.getReqRes() & (RequestType.REQUEST_TYPE_GET_REQUEST | RequestType.REQUEST_TYPE_POST_REQUEST)) {
            return this.handleRESTRequest(serialPacket);

            // if a CLOUD variable
        } else if (serialPacket.getReqRes() & RequestType.REQUEST_TYPE_CLOUD_VARIABLE) {
            return this.handleCloudVariable(serialPacket);

            // if a BROADCAST request
        } else if (serialPacket.getReqRes() & RequestType.REQUEST_TYPE_BROADCAST) {
            return this.handleBroadcast(serialPacket);
        }

        // if any other request type was found, reject it as unrecognised
        return new Promise((resolve, reject) => {
            reject(`Unrecognised packet type (${serialPacket.getReqRes()})`);
        });
    }

    /***
     * Maps a micro:bit query string to a defined query string format and returns
     * it in a list.
     *
     * @param queryString The string to be mapped (comes from the micro:bit)
     * @param queryStringFormat The string format (comes from translations.json)
     */
    private mapQueryString(queryString: string, queryStringFormat: string) {
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

    private processRESTRequest(serialPacket: SerialPacket, responsePacket: SerialPacket, translation: any[], requestType: string): Promise<SerialPacket> {
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
                if (queryObject == null) queryObject = [];
                // console.log(queryObject);

                // regex for finding url parts (e.g. api_endpoint, etc)
                let urlPart;
                let regexp = new RegExp("%([^%]*)%", "g");//"(?=\\w*%)%*\\w+%*");
                let newURL = baseURL;

                // loop through the URL and replace any % surrounded url parts with their queryObject counterparts
                while ((urlPart = regexp.exec(baseURL)) !== null) {
                    // grab the default parameter from the URL
                    let sectionParts = urlPart[1].split("?=");

                    if (sectionParts[0] in queryObject) {
                        // if there is a queryObject part, replace it with the value
                        newURL = newURL.replace(urlPart[0], queryObject[sectionParts[0]]);
                    } else if (sectionParts.length > 1) {
                        // if there is a default, set it to it
                        newURL = newURL.replace(urlPart[0], sectionParts[1]);
                    } else {
                        // if none of the above, replace with nothing
                        newURL = newURL.replace(urlPart[0], "");
                    }
                }

                debug(`Service: ${queryStrMap["service"].toUpperCase()}`, DebugType.DEBUG);

                let headers = {
                    "school-id": this.hub_variables["credentials"]["school_id"],
                    "pi-id": this.hub_variables["credentials"]["pi_id"],
                    'Content-Type': 'application/json',
                };

                //TODO: Temporary hardcoded parts for temporary functionality. This will be replaced with the translations
                switch(queryStrMap["service"]) {
                    case "share":
                        if(queryStrMap["endpoint"] == "fetchData") {
                            try {
                                axios.get(`${newURL}${queryStrMap["unit"]}`, {headers: headers})
                                    .then((success) => {
                                        console.log(success);

                                        let data = String(jspath.apply(endpoint["jspath"], success.data)[0]);

                                        responsePacket.append(data);
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
                                    "share_with": (serialPacket.get(3) ? "SCHOOL" : "ALL")
                                };

                                axios.post(`${newURL}${serialPacket.get(2)}`, jsonData, {headers: headers})
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

                                axios.post(`${newURL}`, jsonData, {headers: headers})
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

                    case "iot":
                        let jsonData = {
                            "value": null
                        };

                        if(requestType == "POST") {
                            try {
                                newURL = newURL.replace("^device^", serialPacket.get(1));

                                if (queryStrMap["endpoint"] == "bulbState" || queryStrMap["endpoint"] == "switchState")
                                    jsonData.value = serialPacket.get(2) == 0 ? "off" : "on";
                                else
                                    jsonData.value = String(serialPacket.get(2));

                                axios.post(`${newURL}`, jsonData, {headers: headers})
                                    .then((success) => {
                                        responsePacket.append(jsonData.value);
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        console.log(error.response);
                                        if (error.response.status == 404) {
                                            reject("DEVICE NOT FOUND");
                                        } else {
                                            reject("COULD NOT REACH DEVICE");
                                        }
                                    });
                            } catch(e) {
                                reject("COULD NOT REACH DEVICE");
                            }
                        } else if(requestType == "GET") {
                            try {
                                newURL = newURL.replace("^device^", queryStrMap["device"]);
                                console.log(newURL);

                                console.log(queryStrMap);

                                axios.get(`${newURL}`, {headers: headers})
                                    .then((success) => {
                                        console.log(success);

                                        let data = String(jspath.apply(endpoint["jspath"], success.data)[0]);

                                        responsePacket.append(data);
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        console.log("ERROR" + error);
                                        reject("COULD NOT GET VARIABLE");
                                        return;
                                    });
                            } catch(e) {
                                reject("COULD NOT REACH DEVICE");
                            }
                        }
                        break;
                    //case "energy":
                    //case "energyMeter":
                    //case "weather":
                    case "carbon":
                        if(queryStrMap["endpoint"] == "index") {
                            try {
                                axios.get(`${newURL}`)
                                    .then((success) => {
                                        console.log(success);

                                        let data = String(jspath.apply(endpoint["jspath"], success.data)[0]);

                                        responsePacket.append(data);
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        reject("COULD NOT GET DATA");
                                    });
                            } catch(e) {
                                reject("COULD NOT GET DATA");
                            }
                        } else if(queryStrMap["endpoint"] == "value") {
                            try {
                                axios.get(`${newURL}`)
                                    .then((success) => {
                                        console.log(success);

                                        let data = String(jspath.apply(endpoint["jspath"], success.data)[0]);

                                        responsePacket.append(data);
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        reject("COULD NOT GET DATA");
                                    });
                            } catch(e) {
                                reject("COULD NOT GET DATA");
                            }
                        } else if(queryStrMap["endpoint"] == "genmix") {
                            try {
                                axios.get(`${newURL}`)
                                    .then((success) => {
                                        console.log(success);
                                        let data = String(jspath.apply(endpoint["jspath"].replace("%unit%", queryStrMap["unit"]), success.data)[0]);

                                        console.log(data);

                                        responsePacket.append(data);
                                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                                        resolve(responsePacket);
                                    })
                                    .catch((error) => {
                                        reject("COULD NOT GET DATA");
                                    });
                            } catch(e) {
                                reject("COULD NOT GET DATA");
                            }
                        }
                        break;

                    default:
                        reject(`UNKNOWN SERVICE ${queryStrMap["service"]}`);
                }
            } catch(e) {
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
    private handleRESTRequest(serialPacket: SerialPacket): Promise<SerialPacket> {
        debug(`REST REQUEST PACKET`, DebugType.DEBUG);
        try {
            let responsePacket = new SerialPacket(serialPacket.getAppID(), serialPacket.getNamespaceID(), serialPacket.getUID());
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
            if (serialPacket.getReqRes() & RequestType.REQUEST_TYPE_GET_REQUEST) {
                requestType = "GET";
                responsePacket.request_type |= RequestType.REQUEST_TYPE_GET_REQUEST;

            } else if (serialPacket.getReqRes() & RequestType.REQUEST_TYPE_POST_REQUEST) {
                requestType = "POST";
                responsePacket.request_type |= RequestType.REQUEST_TYPE_POST_REQUEST;

            } else {
                return new Promise((resolve, reject) => {
                    reject("INVALID REQUEST TYPE");
                });
            }

            return this.processRESTRequest(serialPacket, responsePacket, translation, requestType);
        } catch(e) {
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
    private handleCloudVariable(serialPacket: SerialPacket): Promise<SerialPacket> {
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
    private handleBroadcast(serialPacket: SerialPacket): Promise<SerialPacket> {
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
    private handleHelloPacket(serialPacket: SerialPacket): Promise<SerialPacket> {
        return new Promise((resolve, reject) => {
            debug(`HELLO PACKET`, DebugType.DEBUG);
            debug(`School_ID: ${serialPacket.get(1)} hub_id: ${serialPacket.get(2)}`, DebugType.DEBUG);

            let responsePacket = new SerialPacket(serialPacket.getAppID(), serialPacket.getNamespaceID(), serialPacket.getUID());

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
            responsePacket.setRequestBit(RequestType.REQUEST_TYPE_HELLO);
            responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
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
    public static processGETRequest(url: string, config?: AxiosRequestConfig): Promise<any> {
        return axios.get(url, config);
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
    private processPOSTRequest(url: string, config?: AxiosRequestConfig): Promise<string> {
        return new Promise((resolve, reject) => {
            reject(``);
        });
    }
}