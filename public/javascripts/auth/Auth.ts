import axios from 'axios';
import {BASE_URL} from "../constants/Config";
import TokenManager from "./TokenManager";

export function logIn(username, password) {
    console.log("Logging in");
    return (dispatch) => {
        axios.post(`${BASE_URL}/token/`, {
            username,
            password,
        }).then((response) => {
            console.log("Logged in");
            const data = response.data;
            TokenManager.setTokens(data);
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

export function obtainDashboardToken(locationUid) {
    return new Promise((resolve, reject) => {
        axios.post(`${BASE_URL}/dashboard-token/`, {
            location_uid: locationUid,
        }).then((response) => {
            const data = response.data;
            TokenManager.setTokens(data);
            resolve(data);
        }).catch((error) => {
            reject(error);
            console.log(error); // eslint-disable-line no-console
        });
    });
}

export function logout() {
    return (dispatch) => {
        TokenManager.clear();
        /*dispatch({
            type: AUTH_LOGOUT,
        });*/
        //dispatch(clearUserData());
        //dispatch(push('/'));
    };
}