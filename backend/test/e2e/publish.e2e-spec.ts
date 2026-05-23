import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { createTestApp, closeTestApp } from '../test-app';
import { User } from '../../src/users/user.entity';
import { Build } from '../../src/builds/entities/build.entity';
import { Cpu } from '../../src/components/entities/main-entities/cpu.entity';
import { CpuCooler } from '../../src/components/entities/main-entities/cpu-cooler.entity';
import { Gpu } from '../../src/components/entities/main-entities/gpu.entity';
import { Motherboard } from '../../src/components/entities/main-entities/motherboard.entity';
import { PcCase } from '../../src/components/entities/main-entities/pc-case.entity';
import { PowerSupply } from '../../src/components/entities/main-entities/power-supply.entity';
import { Ram } from '../../src/components/entities/main-entities/ram.entity';
import { StorageDrive } from '../../src/components/entities/main-entities/storage-drive.entity';
import { App } from 'supertest/types';

const IDS = {
  cpu: '3f6c1e2a-4b5d-4a1e-8c2f-1a2b3c4d5e6f',
  cpuCooler: '7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
  gpu: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  motherboard: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
  pcCase: 'c3d4e5f6-a7b8-4c9d-ae0f-1a2b3c4d5e6f',
  powerSupply: 'd4e5f6a7-b8c9-4d0e-bf1a-2b3c4d5e6f7a',
  ram: 'e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b',
  storageDrive: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c',
  cpuWithIgpu: 'a7b8c9d0-e1f2-4a3b-8c4d-5e6f7a8b9c0d',
  cpuWithCooler: 'b8c9d0e1-f2a3-4b4c-9d5e-6f7a8b9c0d1e',
  pcCaseWithPsu: 'c9d0e1f2-a3b4-4c5d-ae6f-7a8b9c0d1e2f',
};

const VALID_BUILD_DTO = {
  name: 'My Build',
  cpuId: IDS.cpu,
  cpuCoolerId: IDS.cpuCooler,
  gpuId: IDS.gpu,
  motherboardId: IDS.motherboard,
  pcCaseId: IDS.pcCase,
  powerSupplyId: IDS.powerSupply,
  fanIds: [],
  monitorIds: [],
  ramIds: [{ componentId: IDS.ram, quantity: 1 }],
  storageDriveIds: [{ componentId: IDS.storageDrive, quantity: 1 }],
};

async function seedComponents(app: INestApplication): Promise<void> {
  const cpuRepo = app.get<Repository<Cpu>>(getRepositoryToken(Cpu));
  const coolerRepo = app.get<Repository<CpuCooler>>(
    getRepositoryToken(CpuCooler),
  );
  const gpuRepo = app.get<Repository<Gpu>>(getRepositoryToken(Gpu));
  const mbRepo = app.get<Repository<Motherboard>>(
    getRepositoryToken(Motherboard),
  );
  const caseRepo = app.get<Repository<PcCase>>(getRepositoryToken(PcCase));
  const psuRepo = app.get<Repository<PowerSupply>>(
    getRepositoryToken(PowerSupply),
  );
  const ramRepo = app.get<Repository<Ram>>(getRepositoryToken(Ram));
  const storageRepo = app.get<Repository<StorageDrive>>(
    getRepositoryToken(StorageDrive),
  );

  await cpuRepo.save([
    Object.assign(new Cpu(), {
      buildcoresId: IDS.cpu,
      name: 'Test CPU',
      includesCooler: false,
      integratedGraphics: null,
    }),
    Object.assign(new Cpu(), {
      buildcoresId: IDS.cpuWithIgpu,
      name: 'Test CPU with iGPU',
      includesCooler: false,
      integratedGraphics: 'Intel UHD 770',
    }),
    Object.assign(new Cpu(), {
      buildcoresId: IDS.cpuWithCooler,
      name: 'Test CPU with Cooler',
      includesCooler: true,
      integratedGraphics: null,
    }),
  ]);

  await coolerRepo.save(
    Object.assign(new CpuCooler(), {
      buildcoresId: IDS.cpuCooler,
      name: 'Test Cooler',
    }),
  );

  await gpuRepo.save(
    Object.assign(new Gpu(), { buildcoresId: IDS.gpu, name: 'Test GPU' }),
  );

  await mbRepo.save(
    Object.assign(new Motherboard(), {
      buildcoresId: IDS.motherboard,
      name: 'Test Motherboard',
    }),
  );

  await caseRepo.save([
    Object.assign(new PcCase(), {
      buildcoresId: IDS.pcCase,
      name: 'Test Case',
      powerSupply: 'None',
    }),
    Object.assign(new PcCase(), {
      buildcoresId: IDS.pcCaseWithPsu,
      name: 'Test Case with PSU',
      powerSupply: '650W',
    }),
  ]);

  await psuRepo.save(
    Object.assign(new PowerSupply(), {
      buildcoresId: IDS.powerSupply,
      name: 'Test PSU',
    }),
  );

  await ramRepo.save(
    Object.assign(new Ram(), { buildcoresId: IDS.ram, name: 'Test RAM' }),
  );

  await storageRepo.save(
    Object.assign(new StorageDrive(), {
      buildcoresId: IDS.storageDrive,
      name: 'Test SSD',
    }),
  );
}

async function registerAndLogin(
  app: INestApplication,
  username = 'alice',
  password = 'password123',
): Promise<string> {
  const res: Response = await request(app.getHttpServer() as App)
    .post('/auth/register')
    .send({ username, password });

  const body = res.body as { accessToken: string };
  return body.accessToken;
}

async function createDraftBuild(
  app: INestApplication,
  token: string,
  dto: object = VALID_BUILD_DTO,
): Promise<number> {
  const res: Response = await request(app.getHttpServer() as App)
    .post('/builds')
    .set('Authorization', `Bearer ${token}`)
    .send(dto);

  const body = res.body as { id: number };
  return body.id;
}

describe('Publish (integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let buildRepository: Repository<Build>;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    buildRepository = app.get<Repository<Build>>(getRepositoryToken(Build));
    await seedComponents(app);
  });

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await buildRepository.query('TRUNCATE TABLE "builds" CASCADE');
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
  });

  afterEach(async () => {
    await buildRepository.query('TRUNCATE TABLE "builds" CASCADE');
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
  });

  describe('POST /publish', () => {
    it('creates and publishes a valid build, returning 201 with published=true', async () => {
      const token = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send(VALID_BUILD_DTO)
        .expect(201);

      const body = res.body as { published: boolean; id: number; name: string };
      expect(body.published).toBe(true);
      expect(body.id).toEqual(expect.any(Number));
      expect(body.name).toBe('My Build');
    });

    it('persists the build as published in the DB', async () => {
      const token = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send(VALID_BUILD_DTO)
        .expect(201);

      const body = res.body as { id: number };
      const build = await buildRepository.findOneOrFail({
        where: { id: body.id },
      });
      expect(build.published).toBe(true);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .post('/publish')
        .send(VALID_BUILD_DTO)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', 'Bearer invalid.token.xyz')
        .send(VALID_BUILD_DTO)
        .expect(401);
    });

    it('returns 409 when a mandatory component is missing (no GPU, no iGPU)', async () => {
      const token = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...VALID_BUILD_DTO, gpuId: undefined })
        .expect(409);
    });

    it('returns 409 when CPU cooler is missing and CPU does not include one', async () => {
      const token = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...VALID_BUILD_DTO, cpuCoolerId: undefined })
        .expect(409);
    });

    it('returns 409 when no RAM is provided', async () => {
      const token = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...VALID_BUILD_DTO, ramIds: [] })
        .expect(409);
    });

    it('returns 409 when no storage drive is provided', async () => {
      const token = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...VALID_BUILD_DTO, storageDriveIds: [] })
        .expect(409);
    });

    it('succeeds when CPU has integrated graphics and no dedicated GPU is provided', async () => {
      const token = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...VALID_BUILD_DTO, cpuId: IDS.cpuWithIgpu, gpuId: undefined })
        .expect(201);

      const body = res.body as { published: boolean };
      expect(body.published).toBe(true);
    });

    it('succeeds when CPU includes cooler and no separate cooler is provided', async () => {
      const token = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...VALID_BUILD_DTO,
          cpuId: IDS.cpuWithCooler,
          cpuCoolerId: undefined,
        })
        .expect(201);

      const body = res.body as { published: boolean };
      expect(body.published).toBe(true);
    });

    it('succeeds when the case has a built-in PSU and no separate PSU is provided', async () => {
      const token = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...VALID_BUILD_DTO,
          pcCaseId: IDS.pcCaseWithPsu,
          powerSupplyId: undefined,
        })
        .expect(201);

      const body = res.body as { published: boolean };
      expect(body.published).toBe(true);
    });

    it('returns 400 when the build name is missing', async () => {
      const token = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...VALID_BUILD_DTO, name: undefined })
        .expect(400);
    });
  });

  describe('PATCH /publish/:id', () => {
    it('publishes an existing draft build and returns 200', async () => {
      const token = await registerAndLogin(app);
      const buildId = await createDraftBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('persists the build as published in the DB', async () => {
      const token = await registerAndLogin(app);
      const buildId = await createDraftBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const build = await buildRepository.findOneOrFail({
        where: { id: buildId },
      });
      expect(build.published).toBe(true);
    });

    it('returns 401 with no token', async () => {
      const token = await registerAndLogin(app);
      const buildId = await createDraftBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      const token = await registerAndLogin(app);
      const buildId = await createDraftBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });

    it('returns 403 when another user tries to publish the build', async () => {
      const aliceToken = await registerAndLogin(app, 'alice');
      const buildId = await createDraftBuild(app, aliceToken);

      const bobToken = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(403);
    });

    it('returns 409 when the build is already published', async () => {
      const token = await registerAndLogin(app);
      const buildId = await createDraftBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('returns 404 when the build does not exist', async () => {
      const token = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .patch('/publish/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 409 when a mandatory component is missing (no GPU, no iGPU)', async () => {
      const token = await registerAndLogin(app);
      const buildId = await createDraftBuild(app, token, {
        ...VALID_BUILD_DTO,
        gpuId: undefined,
        cpuId: IDS.cpu,
      });

      await request(app.getHttpServer() as App)
        .patch(`/publish/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('returns 400 when the id param is not a number', async () => {
      const token = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .patch('/publish/not-a-number')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
