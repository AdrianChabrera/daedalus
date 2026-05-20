export const READ_THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed:   ['rate<0.01'],
  checks:            ['rate>0.99'],
};

export const WRITE_THRESHOLDS = {
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  http_req_failed:   ['rate<0.01'],
  checks:            ['rate>0.99'],
};

export const COMPATIBILITY_THRESHOLDS = {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed:   ['rate<0.01'],
  checks:            ['rate>0.99'],
};
