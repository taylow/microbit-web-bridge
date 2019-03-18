"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * Searches through JSON to locate a given key's value.
 *
 * @param data
 * @param key
 */
function findById(data, key) {
    //Early return
    if (data.id === key) {
        return data;
    }
    let result, element;
    for (element in data) {
        if (data.hasOwnProperty(element) && typeof data[element] === 'object') {
            result = findById(data[element], key);
            if (result) {
                return result;
            }
        }
        else {
            if (element == key)
                return data[element];
        }
    }
    return result;
}
exports.findById = findById;
/***
 * Takes a JSON object and a key and recursively searches through the JSON until
 * the key is located.
 *
 * Note: Code snippet from https://gist.github.com/shakhal/3cf5402fc61484d58c8d
 *
 * @param obj The JSON object being searched
 * @param key The key to recursively searched for
 */
function findValuesHelper(obj, key) {
    let list = [];
    if (!obj)
        return list;
    if (obj instanceof Array) {
        for (var i in obj) {
            list = list.concat(this.findValuesHelper(obj[i], key));
        }
        return list;
    }
    if (obj[key])
        list.push(obj[key]);
    if ((typeof obj == "object") && (obj !== null)) {
        let children = Object.keys(obj);
        if (children.length > 0) {
            for (let i = 0; i < children.length; i++) {
                list = list.concat(this.findValuesHelper(obj[children[i]], key));
            }
        }
    }
    return list;
}
exports.findValuesHelper = findValuesHelper;
//# sourceMappingURL=JsonUtils.js.map