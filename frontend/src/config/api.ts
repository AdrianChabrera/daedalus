const BASE_URL = 'http://localhost:3000'

export const API_ROUTES = {
    // Auth
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    DELETE: `${BASE_URL}/auth/delete`,
    // Components
    COMPONENTS: (type: string) => `${BASE_URL}/components/${type}`,
    COMPONENT: (type: string, id: string) => `${BASE_URL}/components/${type}/${id}`,
    COMPONENTS_COUNT: `${BASE_URL}/components/count`,
    // Builds
    CREATE_BUILD: `${BASE_URL}/builds`,
    MY_BUILDS: `${BASE_URL}/builds/my-builds`,
    PUBLIC_BUILDS: `${BASE_URL}/builds`,
    GET_BUILD: (id: number) =>  `${BASE_URL}/builds/${id}`,
    ASSIGN_COMPONENT: `${BASE_URL}/builds/assign_component`,
    REMOVE_COMPONENT: `${BASE_URL}/builds/remove_component`,
    DELETE_BUILD: (id: number) =>  `${BASE_URL}/builds/${id}`,
    UNPUBLISHED_BUILDS: (cType: string, cId: string) => `${BASE_URL}/builds/unpublished/${cType}/${cId}`,
    PUBLISH_BUILD: `${BASE_URL}/publish`,
    CREATE_AND_PUBLISH_BUILD: `${BASE_URL}/publish`,
    BUILD_PHOTO: (id: number) => `${BASE_URL}/builds/${id}/photo`,
    BUILDS_COUNT: `${BASE_URL}/builds/count`,
    // Compatibility
    CHECK_COMPATIBILITY: `${BASE_URL}/compatibility`,
    COMPATIBLE_COMPONENTS: (type: string) => `${BASE_URL}/compatibility/compatibles/${type}`,
    // Favorites
    MARK_COMPONENT_AS_FAVORITE: (type: string, id: string) => `${BASE_URL}/favorites/components/${type}/${id}`,
    UNMARK_COMPONENT_AS_FAVORITE: (id: string) => `${BASE_URL}/favorites/components/${id}`,
    MARK_AND_UNMARK_BUILD_AS_FAVORITE: (id: number) =>  `${BASE_URL}/favorites/builds/${id}`,
    LIST_FAVORITE_COMPONENTS: (type: string) => `${BASE_URL}/favorites/components/${type}`,
    LIST_FAVORITE_BUILDS: `${BASE_URL}/favorites/builds`,
    // Reviews
    CREATE_REVIEW: `${BASE_URL}/reviews`,
    BUILD_REVIEWS: (buildId: number) => `${BASE_URL}/reviews/builds/${buildId}`,
    COMPONENT_REVIEWS: (componentType: string, componentId: string) => `${BASE_URL}/reviews/components/${componentType}/${componentId}`,
    MY_REVIEWS: `${BASE_URL}/reviews/my-reviews`,
    DELETE_REVIEW: (reviewId: number) => `${BASE_URL}/reviews/${reviewId}`,
    COMPONENT_RATING_STATS: (componentType: string, componentId: string) => `${BASE_URL}/reviews/components/${componentType}/${componentId}/stats`,
};