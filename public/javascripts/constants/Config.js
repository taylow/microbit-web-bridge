"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Site Values */
exports.DOMAIN = 'https://energyinschools.co.uk';
exports.BASE_URL = `${exports.DOMAIN}/api/v1`;
exports.BLOCK_EDITOR_URL = `${exports.DOMAIN}/static/makecode-blockeditor/index.html`;
exports.REFRESH_TOKEN_URL = `${exports.DOMAIN}/api/v1/token/refresh/`;
/* Token Types */
exports.TOKEN_TYPE = Object.freeze({
    API_AUTH: 'apiAuth',
    DASHBOARD_AUTH: 'dashboardAuth',
});
/* Roles */
exports.ADMIN_ROLE = 'admin'; // todo: use nested namespace (like enum)
exports.SLE_ADMIN_ROLE = 'sle_admin';
exports.SEM_ADMIN_ROLE = 'sem_admin';
exports.TEACHER_ROLE = 'teacher';
exports.PUPIL_ROLE = 'pupil';
exports.ES_ADMIN_ROLE = 'es_admin';
exports.ES_USER = 'es_user';
/* Debug Constants */
exports.DEBUG = true;
exports.TIMESTAMPS = true;
//# sourceMappingURL=Config.js.map