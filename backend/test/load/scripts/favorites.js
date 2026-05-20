import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from '../helpers/auth.js';
import { buildPayload } from '../helpers/data.js';
import { READ_THRESHOLDS, WRITE_THRESHOLDS } from '../config/thresholds.js';

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

const FAV_COMPONENTS = [
  { type: 'cpu',           id: SEED.cpu },
  { type: 'gpu',           id: SEED.gpu },
  { type: 'motherboard',   id: SEED.motherboard },
  { type: 'power-supply',  id: SEED.powerSupply },
  { type: 'pc-case',       id: SEED.pcCase },
  { type: 'cpu-cooler',    id: SEED.cpuCooler },
  { type: 'ram',           id: SEED.ram },
  { type: 'storage-drive', id: SEED.storageDrive },
];

export const options = {
  thresholds: {
    ...READ_THRESHOLDS,
    'http_req_duration{scenario:toggle_component_favorite}':  ['p(95)<600'],
    'http_req_duration{scenario:toggle_build_favorite}':      ['p(95)<700'],
    'http_req_duration{scenario:list_favorite_components}':   ['p(95)<500'],
    'http_req_duration{scenario:list_favorite_builds}':       ['p(95)<600'],
  },
  scenarios: {
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
  },
};

export function setup() {
  const owner = { username: 'lt_fav_owner', password: 'loadtest123' };
  const ownerRegRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(owner),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (ownerRegRes.status !== 201 && ownerRegRes.status !== 409) {
    throw new Error(`Unexpected owner register status: ${ownerRegRes.status} ${ownerRegRes.body}`);
  }
  const ownerToken = login(owner.username, owner.password);
  if (!ownerToken) throw new Error('Could not obtain owner token');

  const POOL_SIZE = 20;
  const publishedBuildIds = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const res = http.post(
      `${BASE_URL}/publish`,
      JSON.stringify(buildPayload(`fav-pool-${i}`)),
      { headers: authHeaders(ownerToken) },
    );
    if (res.status !== 201) {
      throw new Error(`Could not publish build ${i}: ${res.status} ${res.body}`);
    }
    publishedBuildIds.push(res.json('id'));
  }

  const reader = { username: 'lt_fav_reader', password: 'loadtest123' };
  const readerRegRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(reader),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (readerRegRes.status !== 201 && readerRegRes.status !== 409) {
    throw new Error(`Unexpected reader register status: ${readerRegRes.status} ${readerRegRes.body}`);
  }
  const readerToken = login(reader.username, reader.password);
  if (!readerToken) throw new Error('Could not obtain reader token');

  for (const buildId of publishedBuildIds) {
    const res = http.post(
      `${BASE_URL}/favorites/builds/${buildId}`,
      null,
      { headers: authHeaders(readerToken) },
    );
    if (res.status !== 201 && res.status !== 409) {
      throw new Error(`Could not pre-load build favorite ${buildId}: ${res.status} ${res.body}`);
    }
  }

  for (const comp of FAV_COMPONENTS) {
    const res = http.post(
      `${BASE_URL}/favorites/components/${comp.type}/${comp.id}`,
      null,
      { headers: authHeaders(readerToken) },
    );
    if (res.status !== 201 && res.status !== 409) {
      throw new Error(`Could not pre-load component favorite ${comp.type}: ${res.status} ${res.body}`);
    }
  }

  return { readerToken, publishedBuildIds };
}

export function toggleComponentFavorite(data) {
  const { readerToken } = data;
  const comp = FAV_COMPONENTS[(__VU - 1) % FAV_COMPONENTS.length];

  const markRes = http.post(
    `${BASE_URL}/favorites/components/${comp.type}/${comp.id}`,
    null,
    { headers: authHeaders(readerToken) },
  );
  check(markRes, {
    'mark component (201 or 409)': (r) => r.status === 201 || r.status === 409,
    'mark acceptable time':        (r) => r.timings.duration < 600,
  });
  if (markRes.status !== 201 && markRes.status !== 409) {
    console.error(`Mark component failed [VU ${__VU} ${comp.type}]: ${markRes.status} ${markRes.body}`);
  }

  const unmarkRes = http.del(
    `${BASE_URL}/favorites/components/${comp.id}`,
    null,
    { headers: authHeaders(readerToken) },
  );
  check(unmarkRes, {
    'unmark component (204 or 404)': (r) => r.status === 204 || r.status === 404,
    'unmark acceptable time':        (r) => r.timings.duration < 600,
  });
  if (unmarkRes.status !== 204 && unmarkRes.status !== 404) {
    console.error(`Unmark component failed [VU ${__VU} ${comp.type}]: ${unmarkRes.status} ${unmarkRes.body}`);
  }

  sleep(1);
}

export function toggleBuildFavorite(data) {
  const { readerToken, publishedBuildIds } = data;
  const buildId = publishedBuildIds[(__VU - 1) % publishedBuildIds.length];

  const markRes = http.post(
    `${BASE_URL}/favorites/builds/${buildId}`,
    null,
    { headers: authHeaders(readerToken) },
  );

  check(markRes, {
    'mark build (201 or 409)': (r) => r.status === 201 || r.status === 409,
    'mark acceptable time':    (r) => r.timings.duration < 700,
  });

  if (markRes.status !== 201 && markRes.status !== 409) {
    console.error(`Mark build ${buildId} failed unexpectedly [VU ${__VU}]: ${markRes.status} ${markRes.body}`);
  }

  const unmarkRes = http.del(
    `${BASE_URL}/favorites/builds/${buildId}`,
    null,
    { headers: authHeaders(readerToken) },
  );
  check(unmarkRes, {
    'unmark build (204 or 404)': (r) => r.status === 204 || r.status === 404,
    'unmark acceptable time':    (r) => r.timings.duration < 700,
  });
  if (unmarkRes.status !== 204 && unmarkRes.status !== 404) {
    console.error(`Unmark build ${buildId} failed [VU ${__VU}]: ${unmarkRes.status} ${unmarkRes.body}`);
  }

  sleep(1);
}

export function listFavoriteComponents(data) {
  const { readerToken } = data;
  const cTypes = ['cpu', 'gpu', 'ram', 'motherboard', 'storage-drive'];
  const cType = cTypes[__ITER % cTypes.length];

  const res = http.get(
    `${BASE_URL}/favorites/components/${cType}?page=1&limit=16&order=name-ASC`,
    { headers: authHeaders(readerToken) },
  );
  check(res, {
    'status 200':       (r) => r.status === 200,
    'has data field':   (r) => Array.isArray(r.json('data')),
    'has total':        (r) => r.json('total') !== undefined,
    'acceptable time':  (r) => r.timings.duration < 500,
  });

  const page2Res = http.get(
    `${BASE_URL}/favorites/components/${cType}?page=2&limit=8`,
    { headers: authHeaders(readerToken) },
  );
  check(page2Res, {
    'pagination status 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function listFavoriteBuilds(data) {
  const { readerToken } = data;

  const res = http.get(
    `${BASE_URL}/favorites/builds?page=1&limit=16&order=name-ASC`,
    { headers: authHeaders(readerToken) },
  );
  check(res, {
    'status 200':      (r) => r.status === 200,
    'has data field':  (r) => Array.isArray(r.json('data')),
    'has total':       (r) => r.json('total') !== undefined,
    'acceptable time': (r) => r.timings.duration < 600,
  });

  const sortedRes = http.get(
    `${BASE_URL}/favorites/builds?page=1&limit=8&order=createdAt-DESC`,
    { headers: authHeaders(readerToken) },
  );
  check(sortedRes, {
    'alternative order 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}