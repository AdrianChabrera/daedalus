import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from '../helpers/auth.js';
import { buildPayload } from '../helpers/data.js';
import {
  READ_THRESHOLDS,
  WRITE_THRESHOLDS,
  COMPATIBILITY_THRESHOLDS,
} from '../config/thresholds.js';

const COMPONENT_TYPES = [
  'cpu', 'cpu-cooler', 'fan', 'gpu', 'keyboard',
  'monitor', 'motherboard', 'mouse', 'pc-case',
  'ram', 'power-supply', 'storage-drive',
];

const SEED = {
  cpu:          'aaaaaaaa-0001-4000-8000-000000000001',
  gpu:          'aaaaaaaa-0002-4000-8000-000000000002',
  motherboard:  'aaaaaaaa-0003-4000-8000-000000000003',
  powerSupply:  'aaaaaaaa-0004-4000-8000-000000000004',
  pcCase:       'aaaaaaaa-0005-4000-8000-000000000005',
  cpuCooler:    'aaaaaaaa-0006-4000-8000-000000000006',
  ram:          'aaaaaaaa-0007-4000-8000-000000000007',
  storageDrive: 'aaaaaaaa-0008-4000-8000-000000000008',
};

const SEED_COMPONENTS = [
  { type: 'cpu',           id: SEED.cpu },
  { type: 'gpu',           id: SEED.gpu },
  { type: 'motherboard',   id: SEED.motherboard },
  { type: 'power-supply',  id: SEED.powerSupply },
  { type: 'pc-case',       id: SEED.pcCase },
  { type: 'cpu-cooler',    id: SEED.cpuCooler },
  { type: 'ram',           id: SEED.ram },
  { type: 'storage-drive', id: SEED.storageDrive },
];

const REVIEWABLE_COMPONENTS = [
  { type: 'cpu',           id: SEED.cpu },
  { type: 'gpu',           id: SEED.gpu },
  { type: 'ram',           id: SEED.ram },
  { type: 'storage-drive', id: SEED.storageDrive },
];

const FAV_COMPONENTS = SEED_COMPONENTS;

const COMPATIBLE_BUILD = {
  cpuId:           SEED.cpu,
  gpuId:           SEED.gpu,
  motherboardId:   SEED.motherboard,
  powerSupplyId:   SEED.powerSupply,
  pcCaseId:        SEED.pcCase,
  cpuCoolerId:     SEED.cpuCooler,
  ramIds:          [{ componentId: SEED.ram,          quantity: 2 }],
  storageDriveIds: [{ componentId: SEED.storageDrive, quantity: 1 }],
  fanIds:          [],
  monitorIds:      [],
};

const PARTIAL_BUILD = {
  cpuId:           SEED.cpu,
  motherboardId:   SEED.motherboard,
  ramIds:          [{ componentId: SEED.ram, quantity: 2 }],
  fanIds:          [],
  monitorIds:      [],
  storageDriveIds: [],
};

const COMPATIBLE_TYPES = ['ram', 'gpu', 'cpu-cooler', 'storage-drive'];

export const options = {
  thresholds: {
    ...READ_THRESHOLDS,
    ...WRITE_THRESHOLDS,
    ...COMPATIBILITY_THRESHOLDS,

    http_req_failed: ['rate<0.10'],

    'http_req_duration{scenario:list_and_filter}':    ['p(95)<500'],
    'http_req_duration{scenario:component_detail}':   ['p(95)<500'],
    'http_req_duration{scenario:create_build}':       ['p(95)<800'],
    'http_req_duration{scenario:update_build}':       ['p(95)<1000'],
    'http_req_duration{scenario:check_compatibility}':   ['p(95)<1200'],
    'http_req_duration{scenario:compatible_components}': ['p(95)<2000'],
    'http_req_duration{scenario:toggle_component_favorite}': ['p(95)<600'],
    'http_req_duration{scenario:toggle_build_favorite}':     ['p(95)<700'],
    'http_req_duration{scenario:list_favorite_components}':  ['p(95)<500'],
    'http_req_duration{scenario:list_favorite_builds}':      ['p(95)<600'],
    'http_req_duration{scenario:create_and_publish}': ['p(95)<1500'],
    'http_req_duration{scenario:publish_existing}':   ['p(95)<1000'],
    'http_req_duration{scenario:register_users}':     ['p(95)<500'],
    'http_req_duration{scenario:create_review_build}':      ['p(95)<700'],
    'http_req_duration{scenario:create_review_component}':  ['p(95)<700'],
    'http_req_duration{scenario:delete_review}':            ['p(95)<500'],
    'http_req_duration{scenario:list_build_reviews}':       ['p(95)<500'],
    'http_req_duration{scenario:list_component_reviews}':   ['p(95)<500'],
    'http_req_duration{scenario:my_reviews}':               ['p(95)<800'],
    'http_req_duration{scenario:component_stats}':          ['p(95)<300'],
  },
  scenarios: {
    list_and_filter: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 40 },
        { duration: '2m',  target: 40 },
        { duration: '20s', target: 0 },
      ],
      exec: 'listAndFilter',
    },
    component_detail: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m',  target: 20 },
        { duration: '20s', target: 0 },
      ],
      exec: 'componentDetail',
    },
    list_builds: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '1m',  target: 30 },
        { duration: '10s', target: 0 },
      ],
      exec: 'listBuilds',
    },
    create_build: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'createBuild',
      startTime: '30s',
    },
    my_builds: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 15 },
        { duration: '40s', target: 15 },
        { duration: '10s', target: 0 },
      ],
      exec: 'myBuilds',
      startTime: '30s',
    },
    update_build: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 5 },
        { duration: '40s', target: 5 },
        { duration: '10s', target: 0 },
      ],
      exec: 'updateBuild',
      startTime: '30s',
    },
    check_compatibility: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m',  target: 20 },
        { duration: '10s', target: 0 },
      ],
      exec: 'checkCompatibility',
    },
    compatible_components: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m',  target: 5 },
        { duration: '10s', target: 0 },
      ],
      exec: 'compatibleComponents',
      startTime: '30s',
    },
    check_partial: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 15 },
        { duration: '1m',  target: 15 },
        { duration: '10s', target: 0 },
      ],
      exec: 'checkPartial',
      startTime: '30s',
    },
    toggle_component_favorite: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 15 },
        { duration: '40s', target: 15 },
        { duration: '10s', target: 0 },
      ],
      exec: 'toggleComponentFavorite',
    },
    toggle_build_favorite: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'toggleBuildFavorite',
      startTime: '10s',
    },
    list_favorite_components: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '40s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      exec: 'listFavoriteComponents',
      startTime: '20s',
    },
    list_favorite_builds: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '40s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      exec: 'listFavoriteBuilds',
      startTime: '20s',
    },
    create_and_publish: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 15 },
        { duration: '1m',  target: 15 },
        { duration: '10s', target: 0 },
      ],
      exec: 'createAndPublish',
    },
    publish_existing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'publishExisting',
      startTime: '30s',
    },
    register_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'registerUsers',
      startTime: '10s',
    },
    create_review_build: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'createReviewBuild',
    },
    create_review_component: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'createReviewComponent',
      startTime: '10s',
    },
    delete_review: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 8 },
        { duration: '30s', target: 8 },
        { duration: '10s', target: 0 },
      ],
      exec: 'deleteReview',
      startTime: '10s',
    },
    list_build_reviews: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '10s', target: 0 },
      ],
      exec: 'listBuildReviews',
      startTime: '20s',
    },
    list_component_reviews: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '40s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      exec: 'listComponentReviews',
      startTime: '20s',
    },
    my_reviews: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'myReviews',
      startTime: '30s',
    },
    component_stats: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 30 },
        { duration: '40s', target: 30 },
        { duration: '10s', target: 0 },
      ],
      exec: 'componentStats',
      startTime: '20s',
    },
  },
};

export function setup() {
  const buildsUser = { username: 'lt_all_builds', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(buildsUser),
    { headers: { 'Content-Type': 'application/json' } });
  const buildsToken = login(buildsUser.username, buildsUser.password);
  if (!buildsToken) throw new Error('Could not obtain builds token');

  const seedBuild = http.post(
    `${BASE_URL}/builds`,
    JSON.stringify(buildPayload('seed')),
    { headers: authHeaders(buildsToken) },
  );
  if (seedBuild.status !== 201) {
    throw new Error(`Could not create seed build: ${seedBuild.status} ${seedBuild.body}`);
  }
  const seedBuildId = seedBuild.json('id');

  const compatUser = { username: 'lt_all_compat', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(compatUser),
    { headers: { 'Content-Type': 'application/json' } });
  const compatToken = login(compatUser.username, compatUser.password);
  if (!compatToken) throw new Error('Could not obtain compatibility token');

  const favOwner = { username: 'lt_all_fav_owner', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(favOwner),
    { headers: { 'Content-Type': 'application/json' } });
  const favOwnerToken = login(favOwner.username, favOwner.password);
  if (!favOwnerToken) throw new Error('Could not obtain favorites owner token');

  const FAV_POOL_SIZE = 20;
  const favBuildIds = [];
  for (let i = 0; i < FAV_POOL_SIZE; i++) {
    const res = http.post(
      `${BASE_URL}/publish`,
      JSON.stringify(buildPayload(`fav-pool-${i}`)),
      { headers: authHeaders(favOwnerToken) },
    );
    if (res.status !== 201) {
      throw new Error(`Could not publish favorites build ${i}: ${res.status} ${res.body}`);
    }
    favBuildIds.push(res.json('id'));
  }

  const favReader = { username: 'lt_all_fav_reader', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(favReader),
    { headers: { 'Content-Type': 'application/json' } });
  const favReaderToken = login(favReader.username, favReader.password);
  if (!favReaderToken) throw new Error('Could not obtain favorites reader token');

  for (const buildId of favBuildIds) {
    http.post(`${BASE_URL}/favorites/builds/${buildId}`, null,
      { headers: authHeaders(favReaderToken) });
  }
  for (const comp of FAV_COMPONENTS) {
    http.post(`${BASE_URL}/favorites/components/${comp.type}/${comp.id}`, null,
      { headers: authHeaders(favReaderToken) });
  }

  const publishUser = { username: 'lt_all_publish', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(publishUser),
    { headers: { 'Content-Type': 'application/json' } });
  const publishToken = login(publishUser.username, publishUser.password);
  if (!publishToken) throw new Error('Could not obtain publish token');

  const revOwner = { username: 'lt_all_rev_owner', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(revOwner),
    { headers: { 'Content-Type': 'application/json' } });
  const revOwnerToken = login(revOwner.username, revOwner.password);
  if (!revOwnerToken) throw new Error('Could not obtain reviews owner token');

  const REV_POOL_SIZE = 15;
  const reviewBuildIds = [];
  for (let i = 0; i < REV_POOL_SIZE; i++) {
    const res = http.post(
      `${BASE_URL}/publish`,
      JSON.stringify(buildPayload(`rev-pool-${i}`)),
      { headers: authHeaders(revOwnerToken) },
    );
    if (res.status !== 201) {
      throw new Error(`Could not publish reviews build ${i}: ${res.status} ${res.body}`);
    }
    reviewBuildIds.push(res.json('id'));
  }

  const reviewer = { username: 'lt_all_reviewer', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(reviewer),
    { headers: { 'Content-Type': 'application/json' } });
  const reviewerToken = login(reviewer.username, reviewer.password);
  if (!reviewerToken) throw new Error('Could not obtain reviewer token');

  const deleter = { username: 'lt_all_deleter', password: 'loadtest123' };
  http.post(`${BASE_URL}/auth/register`, JSON.stringify(deleter),
    { headers: { 'Content-Type': 'application/json' } });
  const deleterToken = login(deleter.username, deleter.password);
  if (!deleterToken) throw new Error('Could not obtain deleter token');

  return {
    buildsToken,
    seedBuildId,
    compatToken,
    favReaderToken,
    favBuildIds,
    publishToken,
    reviewerToken,
    deleterToken,
    reviewBuildIds,
  };
}

export function listAndFilter() {
  const cType = COMPONENT_TYPES[Math.floor(Math.random() * COMPONENT_TYPES.length)];

  const listRes = http.get(
    `${BASE_URL}/components/${cType}?page=1&limit=16&order=name-ASC`,
  );
  check(listRes, {
    'status 200':  (r) => r.status === 200,
    'has results': (r) => r.json('data') !== undefined,
  });

  const filtersRes = http.get(`${BASE_URL}/components/${cType}/filters`);
  check(filtersRes, {
    'filters status 200': (r) => r.status === 200,
  });

  const countRes = http.get(`${BASE_URL}/components/count`);
  check(countRes, {
    'count status 200': (r) => r.status === 200,
    'count is number':  (r) => typeof r.json() === 'number',
  });

  sleep(1);
}

export function componentDetail() {
  const component = SEED_COMPONENTS[Math.floor(Math.random() * SEED_COMPONENTS.length)];

  const res = http.get(`${BASE_URL}/components/${component.type}/${component.id}`);
  check(res, {
    'detail status 200': (r) => r.status === 200,
    'correct id':        (r) => r.json('buildcoresId') === component.id,
  });

  sleep(1);
}

export function listBuilds() {
  const res = http.get(`${BASE_URL}/builds?page=1&limit=16`);
  check(res, {
    'status 200':       (r) => r.status === 200,
    'has data field':   (r) => Array.isArray(r.json('data')),
    'has total field':  (r) => r.json('total') !== undefined,
    'response time OK': (r) => r.timings.duration < 500,
  });

  const sortedRes = http.get(`${BASE_URL}/builds?page=2&limit=8&order=createdAt-DESC`);
  check(sortedRes, {
    'pagination status 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function createBuild(data) {
  const { buildsToken } = data;
  const payload = buildPayload();

  const createRes = http.post(
    `${BASE_URL}/builds`,
    JSON.stringify(payload),
    { headers: authHeaders(buildsToken) },
  );

  if (createRes.status !== 201) {
    console.error(`createBuild failed: ${createRes.status} ${createRes.body}`);
  }

  check(createRes, {
    'build created (201)': (r) => r.status === 201,
    'has id':              (r) => r.json('id') !== undefined,
  });

  if (createRes.status === 201) {
    const buildId = createRes.json('id');
    const getRes = http.get(`${BASE_URL}/builds/${buildId}`,
      { headers: authHeaders(buildsToken) });
    check(getRes, { 'build retrieved (200)': (r) => r.status === 200 });
    http.del(`${BASE_URL}/builds/${buildId}`, null,
      { headers: authHeaders(buildsToken) });
  }

  sleep(2);
}

export function myBuilds(data) {
  const { buildsToken } = data;

  const res = http.get(`${BASE_URL}/builds/my-builds?page=1&limit=16`,
    { headers: authHeaders(buildsToken) });
  check(res, {
    'my-builds status 200': (r) => r.status === 200,
    'has data field':       (r) => Array.isArray(r.json('data')),
    'has total field':      (r) => r.json('total') !== undefined,
  });

  const sortedRes = http.get(
    `${BASE_URL}/builds/my-builds?page=1&limit=8&order=createdAt-DESC`,
    { headers: authHeaders(buildsToken) },
  );
  check(sortedRes, {
    'my-builds pagination 200': (r) => r.status === 200,
    'has data field':           (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function updateBuild(data) {
  const { buildsToken, seedBuildId } = data;
  const payload = buildPayload('updated');

  const updateRes = http.put(
    `${BASE_URL}/builds/${seedBuildId}`,
    JSON.stringify(payload),
    { headers: authHeaders(buildsToken) },
  );

  if (updateRes.status !== 200) {
    console.error(`updateBuild failed: ${updateRes.status} ${updateRes.body}`);
  }

  check(updateRes, {
    'build updated (200)': (r) => r.status === 200,
    'correct id':          (r) => r.json('id') === seedBuildId,
  });

  sleep(2);
}

export function checkCompatibility() {
  const res = http.post(
    `${BASE_URL}/compatibility`,
    JSON.stringify(COMPATIBLE_BUILD),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'status 200':        (r) => r.status === 200,
    'response is array': (r) => Array.isArray(r.json()),
    'acceptable time':   (r) => r.timings.duration < 1200,
  });

  if (res.status === 200) {
    const issues = res.json();
    check(res, {
      'no compatibility errors': () => !issues.some((i) => i.severity === 'error'),
    });
  }

  sleep(1);
}

export function compatibleComponents() {
  const cType = COMPATIBLE_TYPES[(__ITER % COMPATIBLE_TYPES.length)];

  const res = http.post(
    `${BASE_URL}/compatibility/compatibles/${cType}?page=1&limit=16&order=name-ASC`,
    JSON.stringify(COMPATIBLE_BUILD),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'status 200':         (r) => r.status === 200,
    'has data field':     (r) => Array.isArray(r.json('data')),
    'has total field':    (r) => r.json('total') !== undefined,
    'acceptable time':    (r) => r.timings.duration < 2000,
  });

  const page2Res = http.post(
    `${BASE_URL}/compatibility/compatibles/${cType}?page=2&limit=8`,
    JSON.stringify(COMPATIBLE_BUILD),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(page2Res, {
    'pagination status 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(2);
}

export function checkPartial() {
  const res = http.post(
    `${BASE_URL}/compatibility`,
    JSON.stringify(PARTIAL_BUILD),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'status 200':        (r) => r.status === 200,
    'response is array': (r) => Array.isArray(r.json()),
    'acceptable time':   (r) => r.timings.duration < 1200,
  });

  if (res.status === 200) {
    const issues = res.json();
    check(res, {
      'partial build has issues': () => issues.length > 0,
    });
  }

  sleep(1);
}

export function toggleComponentFavorite(data) {
  const { favReaderToken } = data;
  const comp = FAV_COMPONENTS[(__VU - 1) % FAV_COMPONENTS.length];

  const markRes = http.post(
    `${BASE_URL}/favorites/components/${comp.type}/${comp.id}`,
    null,
    { headers: authHeaders(favReaderToken) },
  );
  check(markRes, {
    'mark component (201 or 409)': (r) => r.status === 201 || r.status === 409,
    'mark acceptable time':        (r) => r.timings.duration < 600,
  });

  const unmarkRes = http.del(
    `${BASE_URL}/favorites/components/${comp.id}`,
    null,
    { headers: authHeaders(favReaderToken) },
  );
  check(unmarkRes, {
    'unmark component (204 or 404)': (r) => r.status === 204 || r.status === 404,
    'unmark acceptable time':        (r) => r.timings.duration < 600,
  });

  sleep(1);
}

export function toggleBuildFavorite(data) {
  const { favReaderToken, favBuildIds } = data;
  const buildId = favBuildIds[(__VU - 1) % favBuildIds.length];

  const markRes = http.post(
    `${BASE_URL}/favorites/builds/${buildId}`,
    null,
    { headers: authHeaders(favReaderToken) },
  );
  check(markRes, {
    'mark build (201 or 409)': (r) => r.status === 201 || r.status === 409,
    'mark acceptable time':    (r) => r.timings.duration < 700,
  });

  const unmarkRes = http.del(
    `${BASE_URL}/favorites/builds/${buildId}`,
    null,
    { headers: authHeaders(favReaderToken) },
  );
  check(unmarkRes, {
    'unmark build (204 or 404)': (r) => r.status === 204 || r.status === 404,
    'unmark acceptable time':    (r) => r.timings.duration < 700,
  });

  sleep(1);
}

export function listFavoriteComponents(data) {
  const { favReaderToken } = data;
  const cTypes = ['cpu', 'gpu', 'ram', 'motherboard', 'storage-drive'];
  const cType = cTypes[__ITER % cTypes.length];

  const res = http.get(
    `${BASE_URL}/favorites/components/${cType}?page=1&limit=16&order=name-ASC`,
    { headers: authHeaders(favReaderToken) },
  );
  check(res, {
    'status 200':      (r) => r.status === 200,
    'has data field':  (r) => Array.isArray(r.json('data')),
    'has total':       (r) => r.json('total') !== undefined,
    'acceptable time': (r) => r.timings.duration < 500,
  });

  const page2Res = http.get(
    `${BASE_URL}/favorites/components/${cType}?page=2&limit=8`,
    { headers: authHeaders(favReaderToken) },
  );
  check(page2Res, {
    'pagination status 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function listFavoriteBuilds(data) {
  const { favReaderToken } = data;

  const res = http.get(
    `${BASE_URL}/favorites/builds?page=1&limit=16&order=name-ASC`,
    { headers: authHeaders(favReaderToken) },
  );
  check(res, {
    'status 200':      (r) => r.status === 200,
    'has data field':  (r) => Array.isArray(r.json('data')),
    'has total':       (r) => r.json('total') !== undefined,
    'acceptable time': (r) => r.timings.duration < 600,
  });

  const sortedRes = http.get(
    `${BASE_URL}/favorites/builds?page=1&limit=8&order=createdAt-DESC`,
    { headers: authHeaders(favReaderToken) },
  );
  check(sortedRes, {
    'alternative order 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function createAndPublish(data) {
  const { publishToken } = data;

  const res = http.post(
    `${BASE_URL}/publish`,
    JSON.stringify(buildPayload(`pub-${__VU}-${__ITER}`)),
    { headers: authHeaders(publishToken) },
  );

  check(res, {
    'status 201':       (r) => r.status === 201,
    'published = true': (r) => r.json('published') === true,
    'has id':           (r) => r.json('id') !== undefined,
    'has username':     (r) => r.json('username') !== undefined,
    'acceptable time':  (r) => r.timings.duration < 1500,
  });

  if (res.status !== 201) {
    console.error(`createAndPublish failed [VU ${__VU} iter ${__ITER}]: ${res.status} ${res.body}`);
  }

  sleep(2);
}

export function publishExisting(data) {
  const { publishToken } = data;

  const createRes = http.post(
    `${BASE_URL}/builds`,
    JSON.stringify(buildPayload(`patch-${__VU}-${__ITER}`)),
    { headers: authHeaders(publishToken) },
  );

  const createOk = check(createRes, {
    'build created (201)': (r) => r.status === 201,
  });

  if (!createOk) {
    console.error(`publishExisting create failed [VU ${__VU}]: ${createRes.status} ${createRes.body}`);
    return;
  }

  const buildId = createRes.json('id');

  const publishRes = http.patch(
    `${BASE_URL}/publish/${buildId}`,
    null,
    { headers: authHeaders(publishToken) },
  );

  check(publishRes, {
    'status 200':      (r) => r.status === 200,
    'acceptable time': (r) => r.timings.duration < 1000,
  });

  if (publishRes.status !== 200) {
    console.error(`publishExisting publish failed [build ${buildId}]: ${publishRes.status} ${publishRes.body}`);
  }

  sleep(1);
}

export function registerUsers() {
  const username = `lt_reg_${__VU}_${__ITER}`;
  const password = 'loadtest123';

  const res = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'registration successful (201)': (r) => r.status === 201,
    'has accessToken':               (r) => r.json('accessToken') !== undefined,
    'has userId':                    (r) => r.json('userId') !== undefined,
    'acceptable time':               (r) => r.timings.duration < 500,
  });

  if (res.status !== 201) {
    console.error(`registerUsers failed [${username}]: ${res.status} ${res.body}`);
  }

  sleep(1);
}

export function createReviewBuild(data) {
  const { reviewerToken, reviewBuildIds } = data;
  const buildId = reviewBuildIds[(__VU - 1) % reviewBuildIds.length];

  const res = http.post(
    `${BASE_URL}/reviews`,
    JSON.stringify({
      buildId,
      stars: ((__VU + __ITER) % 5) + 1,
      text:  `Load review VU ${__VU} iter ${__ITER}`,
    }),
    { headers: authHeaders(reviewerToken) },
  );

  check(res, {
    'build review (201 or 409)': (r) => r.status === 201 || r.status === 409,
    'acceptable time':           (r) => r.timings.duration < 700,
  });

  if (res.status === 201) {
    check(res, {
      'has id':        (r) => r.json('id') !== undefined,
      'has stars':     (r) => r.json('stars') !== undefined,
      'has createdAt': (r) => r.json('createdAt') !== undefined,
    });
  }

  if (res.status !== 201 && res.status !== 409) {
    console.error(`createReviewBuild failed [VU ${__VU} build ${buildId}]: ${res.status} ${res.body}`);
  }

  sleep(2);
}

export function createReviewComponent(data) {
  const { reviewerToken } = data;
  const comp = REVIEWABLE_COMPONENTS[(__VU - 1) % REVIEWABLE_COMPONENTS.length];

  const res = http.post(
    `${BASE_URL}/reviews`,
    JSON.stringify({
      componentId:   comp.id,
      componentType: comp.type,
      stars:         ((__VU + __ITER) % 5) + 1,
      text:          `Component review VU ${__VU} iter ${__ITER}`,
    }),
    { headers: authHeaders(reviewerToken) },
  );

  check(res, {
    'component review (201 or 409)': (r) => r.status === 201 || r.status === 409,
    'acceptable time':               (r) => r.timings.duration < 700,
  });

  if (res.status === 201) {
    check(res, {
      'has id':            (r) => r.json('id') !== undefined,
      'has stars':         (r) => r.json('stars') !== undefined,
      'has componentType': (r) => r.json('componentType') !== undefined,
    });
  }

  if (res.status !== 201 && res.status !== 409) {
    console.error(`createReviewComponent failed [VU ${__VU} ${comp.type}]: ${res.status} ${res.body}`);
  }

  sleep(2);
}

export function deleteReview(data) {
  const { deleterToken } = data;
  const comp = REVIEWABLE_COMPONENTS[(__VU - 1) % REVIEWABLE_COMPONENTS.length];

  const createRes = http.post(
    `${BASE_URL}/reviews`,
    JSON.stringify({
      componentId:   comp.id,
      componentType: comp.type,
      stars:         ((__VU) % 5) + 1,
      text:          `Temporary review VU ${__VU} iter ${__ITER}`,
    }),
    { headers: authHeaders(deleterToken) },
  );

  const createOk = check(createRes, {
    'review created (201)': (r) => r.status === 201,
  });

  if (!createOk) {
    if (createRes.status === 409) {
      const myRes = http.get(
        `${BASE_URL}/reviews/my-reviews?page=1&limit=50`,
        { headers: authHeaders(deleterToken) },
      );
      if (myRes.status === 200) {
        const existing = (myRes.json('data') || []).find(
          (r) => r.componentId === comp.id && r.componentType === comp.type,
        );
        if (existing) {
          http.del(`${BASE_URL}/reviews/${existing.id}`, null,
            { headers: authHeaders(deleterToken) });
        }
      }
    } else {
      console.error(`deleteReview create failed [VU ${__VU}]: ${createRes.status} ${createRes.body}`);
    }
    sleep(1);
    return;
  }

  const reviewId = createRes.json('id');

  const deleteRes = http.del(
    `${BASE_URL}/reviews/${reviewId}`,
    null,
    { headers: authHeaders(deleterToken) },
  );

  check(deleteRes, {
    'review deleted (204)': (r) => r.status === 204,
    'acceptable time':      (r) => r.timings.duration < 500,
  });

  if (deleteRes.status !== 204) {
    console.error(`deleteReview delete failed [VU ${__VU}]: ${deleteRes.status} ${deleteRes.body}`);
  }

  sleep(1);
}

export function listBuildReviews(data) {
  const { reviewerToken, reviewBuildIds } = data;
  const buildId = reviewBuildIds[__ITER % reviewBuildIds.length];

  const res = http.get(
    `${BASE_URL}/reviews/builds/${buildId}?page=1&limit=5`,
    { headers: authHeaders(reviewerToken) },
  );

  check(res, {
    'status 200':                (r) => r.status === 200,
    'has data field':            (r) => Array.isArray(r.json('data')),
    'has total':                 (r) => r.json('total') !== undefined,
    'hasCurrentUserReviewed ok': (r) => r.json('hasCurrentUserReviewed') !== undefined,
    'acceptable time':           (r) => r.timings.duration < 500,
  });

  const page2Res = http.get(
    `${BASE_URL}/reviews/builds/${buildId}?page=2&limit=5`,
    { headers: authHeaders(reviewerToken) },
  );
  check(page2Res, {
    'pagination status 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function listComponentReviews(data) {
  const { reviewerToken } = data;
  const comp = REVIEWABLE_COMPONENTS[__ITER % REVIEWABLE_COMPONENTS.length];

  const res = http.get(
    `${BASE_URL}/reviews/components/${comp.type}/${comp.id}?page=1&limit=5`,
    { headers: authHeaders(reviewerToken) },
  );

  check(res, {
    'status 200':                (r) => r.status === 200,
    'has data field':            (r) => Array.isArray(r.json('data')),
    'has total':                 (r) => r.json('total') !== undefined,
    'hasCurrentUserReviewed ok': (r) => r.json('hasCurrentUserReviewed') !== undefined,
    'acceptable time':           (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function myReviews(data) {
  const { reviewerToken } = data;

  const res = http.get(
    `${BASE_URL}/reviews/my-reviews?page=1&limit=8&order=createdAt-DESC`,
    { headers: authHeaders(reviewerToken) },
  );

  check(res, {
    'status 200':      (r) => r.status === 200,
    'has data field':  (r) => Array.isArray(r.json('data')),
    'has total':       (r) => r.json('total') !== undefined,
    'acceptable time': (r) => r.timings.duration < 800,
  });

  const sortedRes = http.get(
    `${BASE_URL}/reviews/my-reviews?page=1&limit=8&order=stars-ASC`,
    { headers: authHeaders(reviewerToken) },
  );
  check(sortedRes, {
    'stars order 200': (r) => r.status === 200,
    'has data field':  (r) => Array.isArray(r.json('data')),
  });

  sleep(2);
}

export function componentStats() {
  const comp = REVIEWABLE_COMPONENTS[__ITER % REVIEWABLE_COMPONENTS.length];

  const res = http.get(
    `${BASE_URL}/reviews/components/${comp.type}/${comp.id}/stats`,
  );

  check(res, {
    'status 200':      (r) => r.status === 200,
    'has average':     (r) => 'average' in r.json(),
    'has count':       (r) => 'count' in r.json(),
    'count is number': (r) => typeof r.json('count') === 'number',
    'acceptable time': (r) => r.timings.duration < 300,
  });

  sleep(1);
}