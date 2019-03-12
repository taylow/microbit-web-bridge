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
     * Processes the REST request coming from the micro:bit and returns a response packet to be sent to the micro:bit.
     *
     * @param serialPacket Incoming serial packet (REST Request)
     * @param responsePacket The response packet to modify
     * @param translation A section of the Translations.json relevant to this request
     * @param requestType The type of request (GET/POST)
     */

    /*    private processRESTRequestTranslation(serialPacket: SerialPacket, responsePacket: SerialPacket, translation: any[], requestType: string): SerialPacket {
            debug("Processing REST request", DebugType.DEBUG);

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
            //console.log(endpoint);

            // gets the queryObject for the specified endpoint
            let queryObject = endpoint["queryObject"];
            // if there was no query object, set it to blank
            if(queryObject == null) queryObject = [];
            // console.log(queryObject);

            // regex for finding url parts (e.g. api_endpoint, etc)
            let urlPart;
            let regexp = new RegExp("%([^%]*)%", "g");//"(?=\\w*%)%*\\w+%*");
            let newURL = baseURL;

            // loop through the URL and replace any % surrounded url parts with their queryObject counterparts
            while((urlPart = regexp.exec(baseURL)) !== null) {
                // grab the default parameter from the URL
                let sectionParts = urlPart[1].split("?=");

                if(sectionParts[0] in queryObject) {
                    // if there is a queryObject part, replace it with the value
                    newURL = newURL.replace(urlPart[0], queryObject[sectionParts[0]]);
                } else if(sectionParts.length > 1) {
                    // if there is a default, set it to it
                    newURL = newURL.replace(urlPart[0], sectionParts[1]);
                } else {
                    // if none of the above, replace with nothing
                    newURL = newURL.replace(urlPart[0], "");
                }
            }

            //console.log(newURL);

            /!*let unit = translation[requestType]["unit"][queryStrMap["unit"]];
            console.log(unit);*!/

            // TODO: This is very temporary to provide data sharing to LGGS
            switch(queryStrMap["service"]) {
                case "share":
                    console.log("SHARE");

                    if(queryStrMap["endpoint"] == "historicalData") {
                        responsePacket.append("DATA SENT");
                        responsePacket.request_type |= RequestStatus.REQUEST_STATUS_OK;

                        let jsonData = {
                            "namespace": serialPacket.get(3),
                            "name": serialPacket.get(2),
                            "type": 0,
                            "unit": serialPacket.get(4),
                            "value": Number(serialPacket.get(1))
                        };

                        let headers = {"school-id": this.hub_variables["credentials"]["school_id"], "pi-id": this.hub_variables["credentials"]["pi_id"]};
                        baseURL = translation[requestType]["extraURL"];

                        $.ajax({
                            type: "POST",
                            dataType: "json",
                            url: `${this.hub_variables["proxy"]["address"]}POST/?url=${baseURL}`,
                            data: jsonData,
                            headers: headers,
                            success: function(data, body, error){
                                // console.log("RESPONSE");
                                // console.log(data);
                                // console.log(body);
                                // console.log(error);
                            }
                        });
                    } else {
                        console.log("NON-HISTORICAL DATA UNIMPLIMENTED");
                        responsePacket.append("Error");
                        responsePacket.request_type |= RequestStatus.REQUEST_STATUS_ERROR; // return error
                    }
                    return responsePacket;

                case "init":
                case "iot":
                case "energy":
                case "energyMeter":
                case "weather":
                case "carbon":
                case "iss":
                    console.log(queryStrMap["service"]);
                    //responsePacket.append(queryStrMap["service"]);
                    break;

                default:
                    console.log("UNKNOWN ENDPOINT");
                    responsePacket.append("Error");
                    responsePacket.request_type |= RequestStatus.REQUEST_STATUS_ERROR; // return error
                    return responsePacket;
            }

            let responseJSON = this.processGETRequest(newURL);
            let result = this.findValuesHelper(responseJSON, endpoint["returns"]);

            //console.log(responseJSON);
            //console.log(endpoint["returns"]);
            //console.log(result);
            responsePacket.append(result);

            responsePacket.request_type |= RequestStatus.REQUEST_STATUS_OK; // return success
            return responsePacket;
        }*/

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

            root = queryPieces[0]; // set the root to the first element
            queryPieces = queryPieces.slice(1); // slice the first element off
        }
        return out;
    }

    private processRESTRequest(serialPacket: SerialPacket, responsePacket: SerialPacket, translation: any[], requestType: string): Promise<SerialPacket> {
        return new Promise((resolve, reject) => {
            console.log(translation);

            // gets the format for the micro:bit query string
            let mbQueryString = translation[requestType]["microbitQueryString"]; // get microbitQueryString from translation
            console.log(mbQueryString);

            // maps the query string coming from the micro:bit to the translated format
            let queryStrMap = this.mapQueryString(serialPacket.get(0), mbQueryString);
            console.log(queryStrMap);

            // gets the baseURL for the specified service
            let baseURL = translation[requestType]["baseURL"];
            console.log(baseURL);

            // gets the endpoint json
            let endpoint = translation[requestType]["endpoint"][queryStrMap["endpoint"]];
            console.log(endpoint);

            // gets the queryObject for the specified endpoint
            let queryObject = endpoint["queryObject"];
            // if there was no query object, set it to blank
            if (queryObject == null) queryObject = [];
            console.log(queryObject);

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

            console.log(newURL);

            console.log(serialPacket.getPayload().length);
            console.log(endpoint["parameters"].length);

            /*for(let parameter in endpoint["parameters"]) {
                console.log(endpoint[parameter]);
                /!*if(endpoint[parameter]["compulsory"]) {
                    console.log("Compulsory");
                }*!/
            }*/

            let headers = {
                "school-id": this.hub_variables["credentials"]["school_id"],
                "pi-id": this.hub_variables["credentials"]["pi_id"]
            };

            //TODO: Temporary hardcoded parts for temporary functionality. This will be replaced with the translations
            switch(queryStrMap["service"]) {
                case "share":
                    console.log("SHARE");

                    if(queryStrMap["endpoint"] == "historicalData") {
                        let jsonData = {
                            "namespace": serialPacket.get(3),
                            "name": serialPacket.get(2),
                            "type": 0,
                            "unit": serialPacket.get(4),
                            "value": Number(serialPacket.get(1))
                        };

                        axios.post(`${this.hub_variables["proxy"]["address"]}/POST/?url=${newURL}`, jsonData, {headers: headers})
                            .then((success) => {
                                console.log(resolve);
                                responsePacket.append("DATA SENT");
                                resolve(responsePacket);
                            })
                            .catch((error) => {
                                console.log("ERROR" + error);
                            });

                    } else {
                        console.log("NON-HISTORICAL DATA UNIMPLIMENTED");
                        reject("ERROR, HISTORIC DATA ONLY");
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
            }

            resolve(responsePacket);
        });
    }

    /***
     * Handles REST requests and gathers the correct translations and data needed to process the REST request.
     *
     * @param serialPacket Incoming serial packet (REST REQUEST)
     */
    private handleRESTRequest(serialPacket: SerialPacket): Promise<SerialPacket> {
        debug(`REST REQUEST PACKET`, DebugType.DEBUG);

        let responsePacket = new SerialPacket(serialPacket.getAppID(), serialPacket.getNamespcaeID(), serialPacket.getUID());
        let queryPieces = serialPacket.get(0).split('/').filter(x => x);
        let root = queryPieces[0];

        queryPieces.shift(); // shift pieces over after getting root

        // check if the endpoint is in the translations
        if (!(root in this.translations)) {
            //TODO: utilise promises more and reject the errors instead
            return new Promise((resolve, reject) => {
                reject(`Invalid Service (${root})`);
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
                reject("Invalid request type");
            });
        }

        return this.processRESTRequest(serialPacket, responsePacket, translation, requestType);
    }

    /***
     * Currently unimplimented.
     * TODO: Implement cloud variables
     *
     * @param serialPacket Incoming serial packet (CLOUD VARIABLE)
     */
    private handleCloudVariable(serialPacket: SerialPacket): Promise<SerialPacket> {
        debug(`CLOUD VARIABLE PACKET (UNIMPLIMENTED)`, DebugType.DEBUG);
        return new Promise((resolve, reject) => {
            reject("Unimplemented");
        });
    }

    /***
     * Currently unimplimented.
     * TODO: Implement broadcast
     *
     * @param serialPacket Incoming serial packet (CLOUD VARIABLE)
     */
    private handleBroadcast(serialPacket: SerialPacket): Promise<SerialPacket> {
        debug(`BROADCAST REQUEST (UNIMPLIMENTED)`, DebugType.WARNING);
        return new Promise((resolve, reject) => {
            reject("Unimplemented");
        });
    }

    /***
     * Handles the Hello packet that is sent from the bridging micro:bit upon initialised connection.
     * An "OK" response is returned.
     *
     * @param serialPacket Incoming serial packet (HELLO PACKET)
     */
    private handleHelloPacket(serialPacket: SerialPacket): Promise<SerialPacket> {
        debug(`HELLO PACKET`, DebugType.DEBUG);
        debug(`School_ID: ${serialPacket.get(1)} hub_id: ${serialPacket.get(2)}`, DebugType.DEBUG);

        let responsePacket = new SerialPacket(serialPacket.getAppID(), serialPacket.getNamespcaeID(), serialPacket.getUID());

        // if the hub has already been authenticated with a hello packet, return error
        if (this.hub_variables["authenticated"]) {
            return new Promise((resolve, reject) => {
                reject("Already Authenticated");
            });
        }

        // set hub variables pi_id and school_id and set authenticate to true
        this.hub_variables["credentials"]["school_id"] = serialPacket.get(1);
        this.hub_variables["credentials"]["pi_id"] = serialPacket.get(2);
        this.hub_variables["authenticated"] = true;

        responsePacket.request_type = RequestType.REQUEST_TYPE_HELLO | RequestStatus.REQUEST_STATUS_OK; // set request type to hello and status to OK
        responsePacket.append(0); // append a 0 for OK

        return new Promise((resolve, reject) => {
            resolve(responsePacket);
        });
    }

    /***
     * Makes a GET request to the given URL
     * @param url
     * @param config
     */
    public static processGETRequest(url: string, config?: AxiosRequestConfig): Promise<any> {
        return axios.get(url, config);
        /*return new Promise((resolve, reject) => {
            reject(`Invalid Service (${root})`);
        });*/
    }

    private processPOSTRequest(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            reject(``);
        });
    }
}