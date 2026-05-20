import { spawn, execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const BACKEND_PORT = 3000;
const HEALTH_URL = `http://localhost:${BACKEND_PORT}/health`;
const DB_PORT = 5434;
const DB_HOST = 'localhost';

const ALL_SCRIPTS = ['components', 'builds', 'compatibility', 'favorites', 'publish', 'reviews', 'all'];

function run(cmd, opts = {}) {
  console.log(`${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function spawnBackground(cmd, args, env = {}) {
  return spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });
}

function killPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = result.trim().split('\n');
    for (const line of lines) {
      if (!line.includes('LISTENING')) continue;
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid) execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    }
  } catch { }
}

async function waitForPort(host, port, retries = 30, interval = 2000) {
  const net = await import('net');
  for (let i = 0; i < retries; i++) {
    await new Promise((resolve, reject) => {
      const socket = net.default.createConnection({ host, port });
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', reject);
    }).then(() => {
      console.log(`Port ${port} ready`);
      return true;
    }).catch(async () => {
      console.log(`Waiting for DB at ${host}:${port}... (${i + 1}/${retries})`);
      await setTimeout(interval);
      return false;
    });

    const ready = await new Promise((resolve) => {
      const socket = net.default.createConnection({ host, port });
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => resolve(false));
    });
    if (ready) return;
  }
  throw new Error(`Port ${port} not available after ${retries} attempts`);
}

async function waitForBackend(url, retries = 30, interval = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    console.log(`Waiting for backend... (${i + 1}/${retries})`);
    await setTimeout(interval);
  }
  throw new Error('Backend did not start in time');
}

const DB_ENV = {
  DB_HOST:     'localhost',
  DB_PORT:     '5434',
  DB_USER:     'loadtest',
  DB_PASSWORD: 'loadtest',
  DB_NAME:     'daedalus_loadtest',
};

let backend;

async function main() {
  const script = process.argv[2];
  if (!script) {
    console.error('Usage: node test/load/run.mjs <script>');
    console.error(`Available scripts: ${ALL_SCRIPTS.join(', ')}`);
    console.error('Example: node test/load/run.mjs builds');
    process.exit(1);
  }

  if (!ALL_SCRIPTS.includes(script)) {
    console.error(`Unknown script: "${script}"`);
    console.error(`Available scripts: ${ALL_SCRIPTS.join(', ')}`);
    process.exit(1);
  }

  try {
    console.log('\nStarting load test database...');
    run('docker compose --profile load-testing up -d');

    console.log('\nWaiting for the database to be ready...');
    await waitForPort(DB_HOST, DB_PORT);

    console.log('\nStarting backend...');
    killPort(BACKEND_PORT);
    backend = spawnBackground('npm', ['run', 'start:dev'], {
      ...DB_ENV,
      JWT_SECRET: 'loadtest_secret',
      NODE_ENV: 'test',
    });

    console.log('\nWaiting for the backend to be ready...');
    await waitForBackend(HEALTH_URL);
    console.log('Backend ready');

    console.log('\nInserting test components...');
    run('node test/load/scripts/seed.mjs', { env: { ...process.env, ...DB_ENV } });

    console.log(`\nRunning load test: ${script}`);
    const k6Flags = script === 'all' ? '--quiet' : '';
    run(`k6 run ${k6Flags} test/load/scripts/${script}.js`);

  } finally {
    console.log('\nCleaning up environment...');
    backend?.kill();
    killPort(BACKEND_PORT);
    run('docker compose --profile load-testing down postgres-loadtest');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});