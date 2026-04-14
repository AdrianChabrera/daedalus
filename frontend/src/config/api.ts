const BASE_URL = 'http://localhost:3000'

export const API_ROUTES = {
    // Auth
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    DELETE: `${BASE_URL}/auth/delete`,
    // Components
    COMPONENTS: (type: string) => `${BASE_URL}/components/${type}`,
    COMPONENT: (type: string, id: string) => `${BASE_URL}/components/${type}/${id}`,
    // Builds
    CREATE_BUILD: `${BASE_URL}/builds`,
    ASSIGN_COMPONENT: `${BASE_URL}/builds/assign_component`,
    REMOVE_COMPONENT: `${BASE_URL}/builds/remove_component`,
    UNPUBLISHED_BUILDS: (cType: string, cId: string) => `${BASE_URL}/builds/unpublished/${cType}/${cId}`,
};