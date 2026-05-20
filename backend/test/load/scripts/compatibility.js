import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from '../helpers/auth.js';
import { buildPayload } from '../helpers/data.js';
import { COMPATIBILITY_THRESHOLDS, READ_THRESHOLDS } from '../config/thresholds.js';

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
    ...COMPATIBILITY_THRESHOLDS,
    'http_req_duration{scenario:check_compatibility}':   ['p(95)<1200'],
    'http_req_duration{scenario:compatible_components}': ['p(95)<2000'],
    'http_req_duration{scenario:list_public_builds}':    ['p(95)<500'],
  },
  scenarios: {
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
  },
};

export function setup() {
  const user = { username: 'loadtest_compat', password: 'loadtest123' };

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

export function checkCompatibility() {
  const res = http.post(
    `${BASE_URL}/compatibility`,
    JSON.stringify(COMPATIBLE_BUILD),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'status 200':          (r) => r.status === 200,
    'response is array':   (r) => Array.isArray(r.json()),
    'acceptable time':     (r) => r.timings.duration < 1200,
  });

  if (res.status === 200) {
    const issues = res.json();
    check(res, {
      'no compatibility errors': () =>
        !issues.some((i) => i.severity === 'error'),
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
    'status 200':              (r) => r.status === 200,
    'has data field':          (r) => Array.isArray(r.json('data')),
    'has total field':         (r) => r.json('total') !== undefined,
    'returns components':      (r) => r.json('total') >= 0,
    'acceptable time':         (r) => r.timings.duration < 2000,
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