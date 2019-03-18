"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const Config_1 = require("../constants/Config");
const TokenManager_1 = require("./TokenManager");
function logIn(username, password) {
    console.log("Logging in");
    return (dispatch) => {
        axios_1.default.post(`${Config_1.BASE_URL}/token/`, {
            username,
            password,
        }).then((response) => {
            console.log("Logged in");
            const data = response.data;
            TokenManager_1.default.setTokens(data);
            console.log(data);
            /*dispatch(getUserInfo(TokenManager.getUserId())).then(() => {
                dispatch(push('/'));
            });*/
        }).catch((error) => {
            //dispatch(showMessageSnackbar(formatErrorMessageFromError(error)));
            console.log(error); // eslint-disable-line no-console
        });
    };
}
exports.logIn = logIn;
function obtainDashboardToken(locationUid) {
    return new Promise((resolve, reject) => {
        axios_1.default.post(`${Config_1.BASE_URL}/dashboard-token/`, {
            location_uid: locationUid,
        }).then((response) => {
            const data = response.data;
            TokenManager_1.default.setTokens(data);
            resolve(data);
        }).catch((error) => {
            reject(error);
            console.log(error); // eslint-disable-line no-console
        });
    });
}
exports.obtainDashboardToken = obtainDashboardToken;
function logout() {
    return (dispatch) => {
        TokenManager_1.default.clear();
        /*dispatch({
            type: AUTH_LOGOUT,
        });*/
        //dispatch(clearUserData());
        //dispatch(push('/'));
    };
}
exports.logout = logout;
//# sourceMappingURL=Auth.js.map