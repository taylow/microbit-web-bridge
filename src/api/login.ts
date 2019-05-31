import axios from 'axios';
import {AbstractApiService} from './core';
import {RoleNames} from "../constants/Config";

class AuthAPIService extends AbstractApiService {
    async login(username: string, password: string) {
        try {
            const response = await axios.post('/token/', {
                username,
                password
            });
            console.log(response);
            localStorage.setItem(AbstractApiService.ACCESS_TOKEN_PARAM, response.data.access);
            localStorage.setItem(AbstractApiService.REFRESH_TOKEN_PARAM, response.data.refresh);
        } catch (error) {
            throw new Error(JSON.stringify(error.response.data));
        }
        if (![RoleNames.TEACHER, RoleNames.SLE_ADMIN].includes(this.RoleName)) {
            this.cleanTokens();
            throw new Error("You don't have permissions to view this page");
        }
        return true
    }
}

export default new AuthAPIService();
