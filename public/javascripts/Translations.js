"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Debug_1 = require("./Debug");
let hub_variables = {
    "authenticated": false,
    "credentials": {
        "school_id": "LZEYG",
        "pi_id": "TESTS"
    },
    "cloud_variable_socket": {
        "address": "localhost",
        "port": 8001
    },
    "translations": {
        //"url": "https://raw.githubusercontent.com/lancaster-university/rest-radio/master/hub/translations.json",
        "url": "/translations",
        "poll_updates": true,
        "poll_time": 60000,
        "json": {}
    },
    "proxy": {
        "address": "/proxy",
        "proxy_requests": true
    }
};
/***
 * Maps a micro:bit query string to a defined query string format and returns
 * it in a list.
 *
 * @param queryString The string to be mapped (comes from the micro:bit)
 * @param queryStringFormat The string format (comes from translations.json)
 */
function mapQueryString(queryString, queryStringFormat) {
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
exports.mapQueryString = mapQueryString;
function processRESTRequest(serialPacket, responsePacket, translation, requestType) {
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
        if (queryObject == null)
            queryObject = [];
        console.log(queryObject);
        // regex for finding url parts (e.g. api_endpoint, etc)
        let urlPart;
        let regexp = new RegExp("%([^%]*)%", "g"); //"(?=\\w*%)%*\\w+%*");
        let fullURL = baseURL;
        // loop through the URL and replace any % surrounded url parts with their queryObject counterparts
        while ((urlPart = regexp.exec(baseURL)) !== null) {
            // grab the default parameter from the URL
            let sectionParts = urlPart[1].split("?=");
            if (sectionParts[0] in queryObject) {
                // if there is a queryObject part, replace it with the value
                fullURL = fullURL.replace(urlPart[0], queryObject[sectionParts[0]]);
            }
            else if (sectionParts.length > 1) {
                // if there is a default, set it to it
                fullURL = fullURL.replace(urlPart[0], sectionParts[1]);
            }
            else {
                // if none of the above, replace with nothing
                fullURL = fullURL.replace(urlPart[0], "");
            }
        }
        Debug_1.debug(`Service: ${queryStrMap["service"].toUpperCase()}`, Debug_1.DebugType.DEBUG);
        console.log(fullURL);
        console.log(serialPacket.getPayload().length);
        console.log(endpoint["parameters"].length);
        /*for(let parameter in endpoint["parameters"]) {
            console.log(endpoint[parameter]);
            /!*if(endpoint[parameter]["compulsory"]) {
                console.log("Compulsory");
            }*!/
        }*/
        let headers = {
            "school-id": hub_variables["credentials"]["school_id"],
            "pi-id": hub_variables["credentials"]["pi_id"]
        };
        resolve(responsePacket);
    });
}
exports.processRESTRequest = processRESTRequest;
//# sourceMappingURL=Translations.js.map