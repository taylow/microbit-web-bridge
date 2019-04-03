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
class HubsAPIService extends core_1.AbstractApiService {
    getWebHubs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('/hubs/');
                return response.data.filter((hub) => hub.type === "browser");
            }
            catch (error) {
                throw new Error(JSON.stringify(error.response.data));
            }
        });
    }
    getHubFirmware(hubUid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('/hubs/microbit-firmware/', {
                    params: { uid: hubUid },
                    responseType: 'arraybuffer',
                });
                return response.data;
            }
            catch (error) {
                throw new Error(JSON.stringify(error.response.data));
            }
        });
    }
}
exports.default = new HubsAPIService();
//# sourceMappingURL=hubs.js.map