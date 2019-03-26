"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO for local development. Request to stage/prod are restricted by CORS
// export const API_ENDPOINT = 'http://127.0.0.1:4000/api/v1';
exports.API_ENDPOINT = 'https://staging.energyinschools.co.uk/api/v1';
/* Token Types */
exports.TOKEN_TYPE = Object.freeze({
    API_AUTH: 'apiAuth',
    DASHBOARD_AUTH: 'dashboardAuth',
});
/* Roles */
var RoleNames;
(function (RoleNames) {
    RoleNames["ADMIN"] = "admin";
    RoleNames["SLE_ADMIN"] = "sle_admin";
    RoleNames["SEM_ADMIN"] = "sem_admin";
    RoleNames["TEACHER"] = "teacher";
    RoleNames["PUPIL"] = "pupil";
    RoleNames["ES_ADMIN"] = "es_admin";
    RoleNames["ES_USER"] = "es_user";
})(RoleNames = exports.RoleNames || (exports.RoleNames = {}));
/* Debug Constants */
exports.DEBUG = true;
exports.TIMESTAMPS = true;
//# sourceMappingURL=Config.js.map