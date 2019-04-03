import * as _ from "lodash";
import * as jwtdecode from 'jwt-decode';
import axios from 'axios';
import {API_ENDPOINT, RoleNames} from "../constants/Config";


export class AbstractApiService {
  static ACCESS_TOKEN_PARAM = 'access';

  static REFRESH_TOKEN_PARAM = 'refresh';

  static UNAUTHORIZED_CODE = 401; // Default unauthorized code

  static FETCH_ACCESS_TOKEN_ENDPOINT = '/token/refresh/';

  axiosInterceptors = {auth: null};

  constructor() {
    axios.defaults.baseURL = API_ENDPOINT;
    axios.defaults.headers.post['Content-Type'] = 'application/json';

    this.injectAxiosInterceptors('auth');
    axios.interceptors.response.use(_.identity, async error => {
      if (
          (error.code !== 'ECONNABORTED' &&
              error.response.status !== AbstractApiService.UNAUTHORIZED_CODE) || // no OAuth error
          !this.RefreshToken || // no refresh token for fetching new access token
          error.config.isRefreshTokenRequest || // error on fetching new access token
          error.config.isRetryRequest // error on retry request
      ) {
        return Promise.reject(error);
      }

      this.ejectAuthInterceptors('auth');

      const isAuthenticated = await this.fetchAccessToken();
      if (!isAuthenticated) {
        return Promise.reject(error);
      }

      this.injectAxiosInterceptors('auth');
      return axios({
        ...error.config,
        url: error.config.url.replace(axios.defaults.baseURL, ''), // fix double base url issue on retries requests
        isRetryRequest: true,
      });
    });
  }

  injectAxiosInterceptors(key) {
    const keys = Array.isArray(key) ? key : [key];

    /* Interceptors callbacks */
    const authInterceptorCallback = config =>
        _.merge(config, {
          headers: {
            authorization: `Bearer ${this.AccessToken}`,
          },
        });
    /* Interceptors callbacks */

    for (const interceptorKey of keys) {
      let interceptor = null;

      switch (interceptorKey) {
        case 'auth':
          interceptor = axios.interceptors.request.use(authInterceptorCallback);
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
      axios.interceptors.request.eject(this.axiosInterceptors[interceptorKey]);
      this.axiosInterceptors[interceptorKey] = null;
    }
  }

  /*
   * Fetch new access token using refresh token
   * 1. Fetch access token
   * 2. Return received access token
   * 3. Store access token
   */
  async fetchAccessToken() {
    const customPayload = {
      isRefreshTokenRequest: true,
    };
    const {data} = await axios({
      url: AbstractApiService.FETCH_ACCESS_TOKEN_ENDPOINT,
      method: 'POST',
      data: {
        [AbstractApiService.REFRESH_TOKEN_PARAM]: this.RefreshToken,
      },
      ...customPayload
    });

    if (!(AbstractApiService.ACCESS_TOKEN_PARAM in data)) {
      return false;
    }

    this.AccessToken = data[AbstractApiService.ACCESS_TOKEN_PARAM];
    return true;
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

  get RoleName(): RoleNames {
    if (!this.AccessToken) {
      throw new Error("No access token")
    }
    const role: string = jwtdecode(this.AccessToken).role;
    return RoleNames[role.toUpperCase()];
  }

  cleanTokens() {
    localStorage.removeItem(AbstractApiService.ACCESS_TOKEN_PARAM);
    localStorage.removeItem(AbstractApiService.REFRESH_TOKEN_PARAM)
  }
}

export class AbstractHubAuthApiService {
  constructor(schoolId: string, hubId: string) {
    axios.defaults.headers.post['Content-Type'] = 'application/json';
    axios.defaults.headers.common['school-id'] = schoolId;
    axios.defaults.headers.common['pi-id'] = hubId;
  }
}
