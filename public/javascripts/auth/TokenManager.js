"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle,no-undef */
var config_1 = require("./constants/config");
//const jwtDecode = require('jwt-decode');
var INVALID_INPUT_PARAMS_ERROR = 'Invalid input parameters';
var ACCESS_TOKEN_KEY = 'access';
var REFRESH_TOKEN_KEY = 'refresh';
var USER_ID_KEY = 'user_id';
var USER_ROLE_KEY = 'role';
var LOCATION_ID_KEY = 'location_id';
var storage = localStorage;
var _accessToken = null;
var _refreshToken = null;
var _userId = null;
var _userRole = null;
var _locationId = null;
/**
 * Set item to Storage by key
 * @param {String} key Storage key
 * @param {*} value Storage value
 * @private
 */
function _setToStorage(key, value) {
    storage.setItem(key, value);
}
/**
 * Serialize tokens
 * @param {String} accessToken Access-Token
 * @param {String} refreshToken Refresh-Token
 * @return {String} Serialized tokens
 * @private
 */
function _serializeTokens(accessToken, refreshToken) {
    var data = {};
    data[ACCESS_TOKEN_KEY] = accessToken;
    data[REFRESH_TOKEN_KEY] = refreshToken;
    data = JSON.stringify(data);
    return data;
}
/**
 * Deserialize tokens
 * @param {String} serializedData Serialized JSON data
 * @returns {Object} Deserialized tokens
 * @private
 */
function _deserializeTokens(serializedData) {
    var result = {};
    try {
        if (serializedData) {
            result = JSON.parse(serializedData);
        }
    }
    catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
    return result;
}
/**
 * Get UserId from Access-Token
 * @param {String} token Access-Token
 * @return {String} UserId or empty string
 * @private
 */
function _getUserIdFromToken(token) {
    var data = 0; //jwtDecode(token);
    return (data && data[USER_ID_KEY]) || '';
}
/**
 * Get User role from Access-Token
 * @param {String} token Access-Token
 * @return {String} User role or empty string
 * @private
 */
function _getUserRoleFromToken(token) {
    var data = 0; //jwtDecode(token);
    return (data && data[USER_ROLE_KEY]) || config_1.ADMIN_ROLE;
}
/**
 * Get location Id from Access-Token
 * @param {String} token Access-Token
 * @return {String} location id from token or empty string
 * @private
 */
function _getLocationIdFromToken(token) {
    var data = 0; //jwtDecode(token);
    return (data && data[LOCATION_ID_KEY]) || '';
}
/**
 * Returns String that is a key to localstorage for getting token based on URL
 * TODO Could be extended for different tokens based on location
 * Now only dashboard token available
 *
 */
function getTokenKeyOnLocation() {
    if (window.location.pathname.startsWith('/energy-dashboard')) {
        return config_1.TOKEN_TYPE.DASHBOARD_AUTH;
    }
    return config_1.TOKEN_TYPE.API_AUTH;
}
/**
 * Initialize TokenManager
 * @private
 */
function _init() {
    var serializedData = storage.getItem(getTokenKeyOnLocation());
    var tokens = _deserializeTokens(serializedData);
    var accessToken = tokens[ACCESS_TOKEN_KEY];
    var refreshToken = tokens[REFRESH_TOKEN_KEY];
    if (!accessToken || !refreshToken) {
        return;
    }
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    _userId = _getUserIdFromToken(accessToken);
    _userRole = _getUserRoleFromToken(accessToken);
    _locationId = _getLocationIdFromToken(accessToken);
}
var TokenManager = {
    setTokens: function (tokens, tokenType) {
        if (tokenType === void 0) { tokenType = getTokenKeyOnLocation(); }
        if (typeof tokens !== 'object' || !tokens[ACCESS_TOKEN_KEY] || !tokens[REFRESH_TOKEN_KEY]) {
            throw new Error(INVALID_INPUT_PARAMS_ERROR);
        }
        var accessToken = tokens[ACCESS_TOKEN_KEY];
        var refreshToken = tokens[REFRESH_TOKEN_KEY];
        _accessToken = accessToken;
        _refreshToken = refreshToken;
        _userId = _getUserIdFromToken(accessToken);
        _userRole = _getUserRoleFromToken(accessToken);
        _locationId = _getLocationIdFromToken(accessToken);
        _setToStorage(tokenType, _serializeTokens(accessToken, refreshToken));
    },
    refreshAuthToken: function (tokens, tokenType) {
        if (tokenType === void 0) { tokenType = getTokenKeyOnLocation(); }
        if (typeof tokens !== 'object' || !tokens[ACCESS_TOKEN_KEY]) {
            throw new Error(INVALID_INPUT_PARAMS_ERROR);
        }
        var accessToken = tokens[ACCESS_TOKEN_KEY];
        _accessToken = accessToken;
        _userId = _getUserIdFromToken(accessToken);
        _setToStorage(tokenType, _serializeTokens(accessToken, _refreshToken));
    },
    getAccessToken: function () {
        return _accessToken;
    },
    getRefreshToken: function () {
        return _refreshToken;
    },
    getUserId: function () {
        return _userId;
    },
    getUserRole: function () {
        return _userRole;
    },
    getLocationId: function () {
        return _locationId;
    },
    getLocationUid: function () {
        return window.location.pathname.split('/').pop();
    },
    getTokenType: function () {
        return getTokenKeyOnLocation();
    },
    clear: function () {
        storage.removeItem(getTokenKeyOnLocation());
        _accessToken = null;
        _refreshToken = null;
        _userId = null;
        _userRole = null;
        _locationId = null;
    },
};
_init();
exports.default = TokenManager;
//# sourceMappingURL=TokenManager.js.map