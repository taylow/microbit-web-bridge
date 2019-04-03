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
const axios_1 = require("axios");
const core_1 = require("./core");
const Config_1 = require("../constants/Config");
class AuthAPIService extends core_1.AbstractApiService {
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post('/token/', {
                    username,
                    password
                });
                console.log(response);
                localStorage.setItem(core_1.AbstractApiService.ACCESS_TOKEN_PARAM, response.data.access);
                localStorage.setItem(core_1.AbstractApiService.REFRESH_TOKEN_PARAM, response.data.refresh);
            }
            catch (error) {
                throw new Error(JSON.stringify(error.response.data));
            }
            if (![Config_1.RoleNames.TEACHER, Config_1.RoleNames.SLE_ADMIN].includes(this.RoleName)) {
                this.cleanTokens();
                throw new Error("You don't have permissions to view this page");
            }
            return true;
        });
    }
}
exports.default = new AuthAPIService();
//# sourceMappingURL=login.js.map