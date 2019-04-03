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
const _ = require("lodash");
const jwtdecode = require("jwt-decode");
const axios_1 = require("axios");
const Config_1 = require("../constants/Config");
class AbstractApiService {
    constructor() {
        this.axiosInterceptors = { auth: null };
        axios_1.default.defaults.baseURL = Config_1.API_ENDPOINT;
        axios_1.default.defaults.headers.post['Content-Type'] = 'application/json';
        this.injectAxiosInterceptors('auth');
        axios_1.default.interceptors.response.use(_.identity, (error) => __awaiter(this, void 0, void 0, function* () {
            if ((error.code !== 'ECONNABORTED' &&
                error.response.status !== AbstractApiService.UNAUTHORIZED_CODE) || // no OAuth error
                !this.RefreshToken || // no refresh token for fetching new access token
                error.config.isRefreshTokenRequest || // error on fetching new access token
                error.config.isRetryRequest // error on retry request
            ) {
                return Promise.reject(error);
            }
            this.ejectAuthInterceptors('auth');
            const isAuthenticated = yield this.fetchAccessToken();
            if (!isAuthenticated) {
                return Promise.reject(error);
            }
            this.injectAxiosInterceptors('auth');
            return axios_1.default(Object.assign({}, error.config, { url: error.config.url.replace(axios_1.default.defaults.baseURL, ''), isRetryRequest: true }));
        }));
    }
    injectAxiosInterceptors(key) {
        const keys = Array.isArray(key) ? key : [key];
        /* Interceptors callbacks */
        const authInterceptorCallback = config => _.merge(config, {
            headers: {
                authorization: `Bearer ${this.AccessToken}`,
            },
        });
        /* Interceptors callbacks */
        for (const interceptorKey of keys) {
            let interceptor = null;
            switch (interceptorKey) {
                case 'auth':
                    interceptor = axios_1.default.interceptors.request.use(authInterceptorCallback);
                    break;
                default:
                    break;
            }
            this.axiosInterceptors[interceptorKey] = interceptor;
        }
    }
    ejectAuthInterceptors(key) {
        const keys = Array.isArray(key) ? key : [key];
        for (const interceptorKey of keys) {
            axios_1.default.interceptors.request.eject(this.axiosInterceptors[interceptorKey]);
            this.axiosInterceptors[interceptorKey] = null;
        }
    }
    /*
     * Fetch new access token using refresh token
     * 1. Fetch access token
     * 2. Return received access token
     * 3. Store access token
     */
    fetchAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const customPayload = {
                isRefreshTokenRequest: true,
            };
            const { data } = yield axios_1.default(Object.assign({ url: AbstractApiService.FETCH_ACCESS_TOKEN_ENDPOINT, method: 'POST', data: {
                    [AbstractApiService.REFRESH_TOKEN_PARAM]: this.RefreshToken,
                } }, customPayload));
            if (!(AbstractApiService.ACCESS_TOKEN_PARAM in data)) {
                return false;
            }
            this.AccessToken = data[AbstractApiService.ACCESS_TOKEN_PARAM];
            return true;
        });
    }
    get AccessToken() {
        return localStorage.getItem(AbstractApiService.ACCESS_TOKEN_PARAM);
    }
    set AccessToken(value) {
        localStorage.setItem(AbstractApiService.ACCESS_TOKEN_PARAM, value);
    }
    get RefreshToken() {
        return localStorage.getItem(AbstractApiService.REFRESH_TOKEN_PARAM);
    }
    set RefreshToken(value) {
        localStorage.setItem(AbstractApiService.REFRESH_TOKEN_PARAM, value);
    }
    get RoleName() {
        if (!this.AccessToken) {
            throw new Error("No access token");
        }
        const role = jwtdecode(this.AccessToken).role;
        return Config_1.RoleNames[role.toUpperCase()];
    }
    cleanTokens() {
        localStorage.removeItem(AbstractApiService.ACCESS_TOKEN_PARAM);
        localStorage.removeItem(AbstractApiService.REFRESH_TOKEN_PARAM);
    }
}
AbstractApiService.ACCESS_TOKEN_PARAM = 'access';
AbstractApiService.REFRESH_TOKEN_PARAM = 'refresh';
AbstractApiService.UNAUTHORIZED_CODE = 401; // Default unauthorized code
AbstractApiService.FETCH_ACCESS_TOKEN_ENDPOINT = '/token/refresh/';
exports.AbstractApiService = AbstractApiService;
class AbstractHubAuthApiService {
    constructor(schoolId, hubId) {
        axios_1.default.defaults.headers.post['Content-Type'] = 'application/json';
        axios_1.default.defaults.headers.common['school-id'] = schoolId;
        axios_1.default.defaults.headers.common['pi-id'] = hubId;
    }
}
exports.AbstractHubAuthApiService = AbstractHubAuthApiService;
//# sourceMappingURL=core.js.map