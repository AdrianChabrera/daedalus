import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../helpers/auth.js';
import { READ_THRESHOLDS } from '../config/thresholds.js';

const COMPONENT_TYPES = [
  'cpu', 'cpu-cooler', 'fan', 'gpu', 'keyboard',
  'monitor', 'motherboard', 'mouse', 'pc-case',
  'ram', 'power-supply', 'storage-drive',
];

const SEED_COMPONENTS = [
  { type: 'cpu',           id: 'aaaaaaaa-0001-4000-8000-000000000001' },
  { type: 'gpu',           id: 'aaaaaaaa-0002-4000-8000-000000000002' },
  { type: 'motherboard',   id: 'aaaaaaaa-0003-4000-8000-000000000003' },
  { type: 'power-supply',  id: 'aaaaaaaa-0004-4000-8000-000000000004' },
  { type: 'pc-case',       id: 'aaaaaaaa-0005-4000-8000-000000000005' },
  { type: 'cpu-cooler',    id: 'aaaaaaaa-0006-4000-8000-000000000006' },
  { type: 'ram',           id: 'aaaaaaaa-0007-4000-8000-000000000007' },
  { type: 'storage-drive', id: 'aaaaaaaa-0008-4000-8000-000000000008' },
];

export const options = {
  thresholds: READ_THRESHOLDS,
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
  },
};

export function listAndFilter() {
  const cType = COMPONENT_TYPES[Math.floor(Math.random() * COMPONENT_TYPES.length)];

  const listRes = http.get(
    `${BASE_URL}/components/${cType}?page=1&limit=16&order=name-ASC`,
  );

  check(listRes, {
    'status 200':    (r) => r.status === 200,
    'has results':   (r) => r.json('data') !== undefined,
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