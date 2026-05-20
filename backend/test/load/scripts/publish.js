import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from '../helpers/auth.js';
import { buildPayload } from '../helpers/data.js';
import { WRITE_THRESHOLDS } from '../config/thresholds.js';

export const options = {
  thresholds: {
    ...WRITE_THRESHOLDS,
    'http_req_duration{scenario:create_and_publish}':  ['p(95)<1500'],
    'http_req_duration{scenario:publish_existing}':    ['p(95)<1000'],
    'http_req_duration{scenario:register_users}':      ['p(95)<500'],
  },
  scenarios: {
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
  },
};

export function setup() {
  const user = { username: 'loadtest_publish', password: 'loadtest123' };

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

  return { token };
}

export function createAndPublish(data) {
  const { token } = data;

  const res = http.post(
    `${BASE_URL}/publish`,
    JSON.stringify(buildPayload(`pub-${__VU}-${__ITER}`)),
    { headers: authHeaders(token) },
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
  const { token } = data;

  const createRes = http.post(
    `${BASE_URL}/builds`,
    JSON.stringify(buildPayload(`patch-${__VU}-${__ITER}`)),
    { headers: authHeaders(token) },
  );

  const createOk = check(createRes, {
    'build created (201)': (r) => r.status === 201,
  });

  if (!createOk) {
    console.error(`Create failed [VU ${__VU} iter ${__ITER}]: ${createRes.status} ${createRes.body}`);
    return;
  }

  const buildId = createRes.json('id');

  const publishRes = http.patch(
    `${BASE_URL}/publish/${buildId}`,
    null,
    { headers: authHeaders(token) },
  );

  check(publishRes, {
    'status 200':      (r) => r.status === 200,
    'acceptable time': (r) => r.timings.duration < 1000,
  });

  if (publishRes.status !== 200) {
    console.error(`Publish failed [build ${buildId}]: ${publishRes.status} ${publishRes.body}`);
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