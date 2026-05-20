import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from '../helpers/auth.js';
import { buildPayload } from '../helpers/data.js';
import { READ_THRESHOLDS, WRITE_THRESHOLDS } from '../config/thresholds.js';

const SEED = {
  cpu:          'aaaaaaaa-0001-4000-8000-000000000001',
  gpu:          'aaaaaaaa-0002-4000-8000-000000000002',
  ram:          'aaaaaaaa-0007-4000-8000-000000000007',
  storageDrive: 'aaaaaaaa-0008-4000-8000-000000000008',
};

const REVIEWABLE_COMPONENTS = [
  { type: 'cpu',           id: SEED.cpu },
  { type: 'gpu',           id: SEED.gpu },
  { type: 'ram',           id: SEED.ram },
  { type: 'storage-drive', id: SEED.storageDrive },
];

export const options = {
  thresholds: {
    ...WRITE_THRESHOLDS,
    http_req_failed: ['rate<0.10'],
    'http_req_duration{scenario:create_review_build}':      ['p(95)<700'],
    'http_req_duration{scenario:create_review_component}':  ['p(95)<700'],
    'http_req_duration{scenario:delete_review}': ['p(95)<500'],
    'http_req_duration{scenario:list_build_reviews}': ['p(95)<500'],
    'http_req_duration{scenario:list_component_reviews}': ['p(95)<500'],
    'http_req_duration{scenario:my_reviews}': ['p(95)<800'],
    'http_req_duration{scenario:component_stats}': ['p(95)<300'],
  },
  scenarios: {
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
  const owner = { username: 'lt_rev_owner', password: 'loadtest123' };
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

  const POOL_SIZE = 15;
  const publishedBuildIds = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const res = http.post(
      `${BASE_URL}/publish`,
      JSON.stringify(buildPayload(`rev-pool-${i}`)),
      { headers: authHeaders(ownerToken) },
    );
    if (res.status !== 201) {
      throw new Error(`Could not publish build ${i}: ${res.status} ${res.body}`);
    }
    publishedBuildIds.push(res.json('id'));
  }

  const reviewer = { username: 'lt_rev_reviewer', password: 'loadtest123' };
  const reviewerRegRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(reviewer),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (reviewerRegRes.status !== 201 && reviewerRegRes.status !== 409) {
    throw new Error(`Unexpected reviewer register status: ${reviewerRegRes.status} ${reviewerRegRes.body}`);
  }
  const reviewerToken = login(reviewer.username, reviewer.password);
  if (!reviewerToken) throw new Error('Could not obtain reviewer token');

  const deleter = { username: 'lt_rev_deleter', password: 'loadtest123' };
  const deleterRegRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(deleter),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (deleterRegRes.status !== 201 && deleterRegRes.status !== 409) {
    throw new Error(`Unexpected deleter register status: ${deleterRegRes.status} ${deleterRegRes.body}`);
  }
  const deleterToken = login(deleter.username, deleter.password);
  if (!deleterToken) throw new Error('Could not obtain deleter token');

  return { reviewerToken, deleterToken, publishedBuildIds, ownerToken };
}

export function createReviewBuild(data) {
  const { reviewerToken, publishedBuildIds } = data;

  const buildId = publishedBuildIds[(__VU - 1) % publishedBuildIds.length];

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
    console.error(`createReviewComponent failed [VU ${__VU} ${comp.type}/${comp.id}]: ${res.status} ${res.body}`);
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
        const reviews = myRes.json('data') || [];
        const existing = reviews.find(
          (r) => r.componentId === comp.id && r.componentType === comp.type,
        );
        if (existing) {
          http.del(
            `${BASE_URL}/reviews/${existing.id}`,
            null,
            { headers: authHeaders(deleterToken) },
          );
        }
      }
    } else {
      console.error(`Create in delete_review failed [VU ${__VU}]: ${createRes.status} ${createRes.body}`);
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
    console.error(`Delete review ${reviewId} failed [VU ${__VU}]: ${deleteRes.status} ${deleteRes.body}`);
  }

  sleep(1);
}

export function listBuildReviews(data) {
  const { reviewerToken, publishedBuildIds } = data;

  const buildId = publishedBuildIds[__ITER % publishedBuildIds.length];

  const res = http.get(
    `${BASE_URL}/reviews/builds/${buildId}?page=1&limit=5`,
    { headers: authHeaders(reviewerToken) },
  );

  check(res, {
    'status 200':                   (r) => r.status === 200,
    'has data field':               (r) => Array.isArray(r.json('data')),
    'has total':                    (r) => r.json('total') !== undefined,
    'hasCurrentUserReviewed ok':    (r) => r.json('hasCurrentUserReviewed') !== undefined,
    'acceptable time':              (r) => r.timings.duration < 500,
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

  if (res.status !== 200) {
    console.error(`listComponentReviews failed [${comp.type}/${comp.id}]: ${res.status} ${res.body}`);
  }

  sleep(1);
}

export function myReviews(data) {
  const { reviewerToken } = data;

  const res = http.get(
    `${BASE_URL}/reviews/my-reviews?page=1&limit=8&order=createdAt-DESC`,
    { headers: authHeaders(reviewerToken) },
  );

  check(res, {
    'status 200':       (r) => r.status === 200,
    'has data field':   (r) => Array.isArray(r.json('data')),
    'has total':        (r) => r.json('total') !== undefined,
    'acceptable time':  (r) => r.timings.duration < 800,
  });

  const sortedRes = http.get(
    `${BASE_URL}/reviews/my-reviews?page=1&limit=8&order=stars-ASC`,
    { headers: authHeaders(reviewerToken) },
  );

  check(sortedRes, {
    'stars order 200':  (r) => r.status === 200,
    'has data field':   (r) => Array.isArray(r.json('data')),
  });

  sleep(2);
}

export function componentStats() {
  const comp = REVIEWABLE_COMPONENTS[__ITER % REVIEWABLE_COMPONENTS.length];

  const res = http.get(
    `${BASE_URL}/reviews/components/${comp.type}/${comp.id}/stats`,
  );

  check(res, {
    'status 200':       (r) => r.status === 200,
    'has average':      (r) => 'average' in r.json(),
    'has count':        (r) => 'count' in r.json(),
    'count is number':  (r) => typeof r.json('count') === 'number',
    'acceptable time':  (r) => r.timings.duration < 300,
  });

  sleep(1);
}