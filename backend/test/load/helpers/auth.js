import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function login(username, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'successful login': (r) => r.status === 200,
    'token present': (r) => r.json('accessToken') !== undefined,
  });

  if (res.status !== 200) {
    console.error(`Login failed for ${username}: ${res.body}`);
    return null;
  }

  return res.json('accessToken');
}

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export { BASE_URL };
