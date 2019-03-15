/* Site Values */
export const DOMAIN = 'https://energyinschools.co.uk';
export const BASE_URL = `${DOMAIN}/api/v1`;
export const BLOCK_EDITOR_URL = `${DOMAIN}/static/makecode-blockeditor/index.html`;
export const REFRESH_TOKEN_URL = `${DOMAIN}/api/v1/token/refresh/`;

/* Token Types */
export const TOKEN_TYPE = Object.freeze({
    API_AUTH: 'apiAuth',
    DASHBOARD_AUTH: 'dashboardAuth',
});

/* Roles */
export const ADMIN_ROLE = 'admin'; // todo: use nested namespace (like enum)
export const SLE_ADMIN_ROLE = 'sle_admin';
export const SEM_ADMIN_ROLE = 'sem_admin';
export const TEACHER_ROLE = 'teacher';
export const PUPIL_ROLE = 'pupil';
export const ES_ADMIN_ROLE = 'es_admin';
export const ES_USER = 'es_user';

/* Debug Constants */
export const DEBUG = true;
export const TIMESTAMPS = true;
