import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from '../helpers/auth.js';
import { buildPayload } from '../helpers/data.js';
import { READ_THRESHOLDS } from '../config/thresholds.js';

export const options = {
  thresholds: {
    ...READ_THRESHOLDS,
    'http_req_duration{scenario:create_build}':   ['p(95)<800'],
    'http_req_duration{scenario:update_build}':   ['p(95)<1000'],
  },
  scenarios: {
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
  },
};

export function setup() {
  const user = { username: 'loadtest_builds', password: 'loadtest123' };

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (registerRes.status !== 201 && registerRes.status !== 409) {
    throw new Error(`Unexpected register status: ${registerRes.status} ${registerRes.body}`);
  }

  const token = login(user.username, user.password);
  if (!token) throw new Error('Could not obtain token in setup');

  const seedBuild = http.post(
    `${BASE_URL}/builds`,
    JSON.stringify(buildPayload('seed')),
    { headers: authHeaders(token) },
  );
  if (seedBuild.status !== 201) {
    throw new Error(`Could not create seed build: ${seedBuild.status} ${seedBuild.body}`);
  }
  const seedBuildId = seedBuild.json('id');

  return { token, seedBuildId };
}

export function listBuilds() {
  const res = http.get(`${BASE_URL}/builds?page=1&limit=16`);

  check(res, {
    'status 200':              (r) => r.status === 200,
    'has data field':          (r) => Array.isArray(r.json('data')),
    'has total field':         (r) => r.json('total') !== undefined,
    'response time OK':        (r) => r.timings.duration < 500,
  });

  const sortedRes = http.get(`${BASE_URL}/builds?page=2&limit=8&order=createdAt-DESC`);

  check(sortedRes, {
    'pagination status 200': (r) => r.status === 200,
    'has data field':        (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function createBuild(data) {
  const { token } = data;
  const payload = buildPayload();

  const createRes = http.post(
    `${BASE_URL}/builds`,
    JSON.stringify(payload),
    { headers: authHeaders(token) },
  );

  if (createRes.status !== 201) {
    console.error(`Create failed: ${createRes.status} ${createRes.body}`);
    console.error(`Payload: ${JSON.stringify(payload)}`);
  }

  check(createRes, {
    'build created (201)': (r) => r.status === 201,
    'has id':              (r) => r.json('id') !== undefined,
  });

  if (createRes.status === 201) {
    const buildId = createRes.json('id');

    const getRes = http.get(
      `${BASE_URL}/builds/${buildId}`,
      { headers: authHeaders(token) },
    );

    check(getRes, {
      'build retrieved (200)': (r) => r.status === 200,
    });

    http.del(
      `${BASE_URL}/builds/${buildId}`,
      null,
      { headers: authHeaders(token) },
    );
  }

  sleep(2);
}

export function myBuilds(data) {
  const { token } = data;

  const res = http.get(
    `${BASE_URL}/builds/my-builds?page=1&limit=16`,
    { headers: authHeaders(token) },
  );

  check(res, {
    'my-builds status 200': (r) => r.status === 200,
    'has data field':       (r) => Array.isArray(r.json('data')),
    'has total field':      (r) => r.json('total') !== undefined,
  });

  const sortedRes = http.get(
    `${BASE_URL}/builds/my-builds?page=1&limit=8&order=createdAt-DESC`,
    { headers: authHeaders(token) },
  );

  check(sortedRes, {
    'my-builds pagination 200': (r) => r.status === 200,
    'has data field':           (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}

export function updateBuild(data) {
  const { token, seedBuildId } = data;
  const payload = buildPayload('updated');

  const updateRes = http.put(
    `${BASE_URL}/builds/${seedBuildId}`,
    JSON.stringify(payload),
    { headers: authHeaders(token) },
  );

  if (updateRes.status !== 200) {
    console.error(`Update failed: ${updateRes.status} ${updateRes.body}`);
  }

  check(updateRes, {
    'build updated (200)': (r) => r.status === 200,
    'correct id':          (r) => r.json('id') === seedBuildId,
  });

  sleep(2);
}