// TODO for local development. Request to stage/prod are restricted by CORS
// import translations from '../../translations/translations_local.json';

export const API_ENDPOINT = 'http://127.0.0.1:4000/api/v1';
// export const API_ENDPOINT = 'https://staging.energyinschools.co.uk/api/v1';

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
