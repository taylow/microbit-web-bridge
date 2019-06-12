// This constant is handled by webpack depending on build environment
declare const API_ENDPOINT: string;
const _API_ENDPOINT = API_ENDPOINT;
export {_API_ENDPOINT as API_ENDPOINT};

/* Token Types */
export const TOKEN_TYPE = Object.freeze({
    API_AUTH: 'apiAuth',
    DASHBOARD_AUTH: 'dashboardAuth',
});

/* Roles */
export enum RoleNames {
    ADMIN = 'admin',
    SLE_ADMIN = 'sle_admin',
    SEM_ADMIN = 'sem_admin',
    TEACHER = 'teacher',
    PUPIL = 'pupil',
    ES_ADMIN = 'es_admin',
    ES_USER = 'es_user',
}

/* Debug Constants */
export const DEBUG = true;
export const TIMESTAMPS = true;
