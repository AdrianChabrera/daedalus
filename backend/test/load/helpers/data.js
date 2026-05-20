export const TEST_USERS = [
  { username: 'loadtest_user1', password: 'loadtest123' },
  { username: 'loadtest_user2', password: 'loadtest123' },
  { username: 'loadtest_user3', password: 'loadtest123' },
];

export function pickUser() {
  return TEST_USERS[(__VU - 1) % TEST_USERS.length];
}

const SEED_IDS = {
  cpu:          'aaaaaaaa-0001-4000-8000-000000000001',
  gpu:          'aaaaaaaa-0002-4000-8000-000000000002',
  motherboard:  'aaaaaaaa-0003-4000-8000-000000000003',
  powerSupply:  'aaaaaaaa-0004-4000-8000-000000000004',
  pcCase:       'aaaaaaaa-0005-4000-8000-000000000005',
  cpuCooler:    'aaaaaaaa-0006-4000-8000-000000000006',
  ram:          'aaaaaaaa-0007-4000-8000-000000000007',
  storageDrive: 'aaaaaaaa-0008-4000-8000-000000000008',
};

export function buildPayload(suffix = '') {
  return {
    name:        `Load Test Build ${suffix || __VU}`,
    description: 'Build creado por test de carga',
    cpuId:         SEED_IDS.cpu,
    gpuId:         SEED_IDS.gpu,
    motherboardId: SEED_IDS.motherboard,
    powerSupplyId: SEED_IDS.powerSupply,
    pcCaseId:      SEED_IDS.pcCase,
    cpuCoolerId:   SEED_IDS.cpuCooler,
    ramIds:          [{ componentId: SEED_IDS.ram,          quantity: 2 }],
    storageDriveIds: [{ componentId: SEED_IDS.storageDrive, quantity: 1 }],
    fanIds:          [],
    monitorIds:      [],
  };
}