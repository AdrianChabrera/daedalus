import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { createTestApp, closeTestApp } from '../test-app';
import { User } from '../../src/users/user.entity';
import { Build } from '../../src/builds/entities/build.entity';
import { Cpu } from '../../src/components/entities/main-entities/cpu.entity';
import { Gpu } from '../../src/components/entities/main-entities/gpu.entity';
import { Ram } from '../../src/components/entities/main-entities/ram.entity';
import { StorageDrive } from '../../src/components/entities/main-entities/storage.entity';
import { Motherboard } from '../../src/components/entities/main-entities/motherboard.entity';
import { PcCase } from '../../src/components/entities/main-entities/pc-case.entity';
import { PowerSupply } from '../../src/components/entities/main-entities/power-supply.entity';
import { CpuCooler } from '../../src/components/entities/main-entities/cpu-cooler.entity';
import { Fan } from '../../src/components/entities/main-entities/fan.entity';
import { Monitor } from '../../src/components/entities/main-entities/monitor.entity';
import { App } from 'supertest/types';

const IDS = {
  cpu: '3f6c1e2a-4b5d-4a1e-8c2f-1a2b3c4d5e6f',
  cpuCooler: '7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
  gpu: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  motherboard: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
  pcCase: 'c3d4e5f6-a7b8-4c9d-ae0f-1a2b3c4d5e6f',
  powerSupply: 'd4e5f6a7-b8c9-4d0e-bf1a-2b3c4d5e6f7a',
  ram: 'e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b',
  ram2: 'a9b8c7d6-e5f4-4a3b-9c2d-1e0f9a8b7c6d',
  storageDrive: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c',
  fan: 'd0e1f2a3-b4c5-4d6e-bf7a-8b9c0d1e2f3a',
  monitor: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
};

const EMPTY_BUILD_DTO = {
  name: 'My Draft Build',
  fanIds: [],
  monitorIds: [],
  ramIds: [],
  storageDriveIds: [],
};

const FULL_BUILD_DTO = {
  name: 'Full Build',
  description: 'A complete build',
  cpuId: IDS.cpu,
  cpuCoolerId: IDS.cpuCooler,
  gpuId: IDS.gpu,
  motherboardId: IDS.motherboard,
  pcCaseId: IDS.pcCase,
  powerSupplyId: IDS.powerSupply,
  fanIds: [{ componentId: IDS.fan, quantity: 1 }],
  monitorIds: [{ componentId: IDS.monitor, quantity: 1 }],
  ramIds: [{ componentId: IDS.ram, quantity: 2 }],
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
  const fanRepo = app.get<Repository<Fan>>(getRepositoryToken(Fan));
  const monitorRepo = app.get<Repository<Monitor>>(getRepositoryToken(Monitor));

  await cpuRepo.save(
    Object.assign(new Cpu(), {
      buildcoresId: IDS.cpu,
      name: 'Test CPU',
      includesCooler: false,
      integratedGraphics: null,
    }),
  );
  await coolerRepo.save(
    Object.assign(new CpuCooler(), {
      buildcoresId: IDS.cpuCooler,
      name: 'Test Cooler',
    }),
  );
  await gpuRepo.save(
    Object.assign(new Gpu(), {
      buildcoresId: IDS.gpu,
      name: 'Test GPU',
    }),
  );
  await mbRepo.save(
    Object.assign(new Motherboard(), {
      buildcoresId: IDS.motherboard,
      name: 'Test Motherboard',
    }),
  );
  await caseRepo.save(
    Object.assign(new PcCase(), {
      buildcoresId: IDS.pcCase,
      name: 'Test Case',
      powerSupply: 'None',
    }),
  );
  await psuRepo.save(
    Object.assign(new PowerSupply(), {
      buildcoresId: IDS.powerSupply,
      name: 'Test PSU',
    }),
  );
  await ramRepo.save([
    Object.assign(new Ram(), { buildcoresId: IDS.ram, name: 'Test RAM' }),
    Object.assign(new Ram(), { buildcoresId: IDS.ram2, name: 'Test RAM 2' }),
  ]);
  await storageRepo.save(
    Object.assign(new StorageDrive(), {
      buildcoresId: IDS.storageDrive,
      name: 'Test SSD',
    }),
  );
  await fanRepo.save(
    Object.assign(new Fan(), {
      buildcoresId: IDS.fan,
      name: 'Test Fan',
    }),
  );
  await monitorRepo.save(
    Object.assign(new Monitor(), {
      buildcoresId: IDS.monitor,
      name: 'Test Monitor',
    }),
  );
}

async function registerAndLogin(
  app: INestApplication,
  username = 'alice',
  password = 'password123',
): Promise<{ token: string; userId: number }> {
  const res: Response = await request(app.getHttpServer() as App)
    .post('/auth/register')
    .send({ username, password });

  const body = res.body as { accessToken: string; userId: number };
  return { token: body.accessToken, userId: body.userId };
}

async function createBuild(
  app: INestApplication,
  token: string,
  dto: object = EMPTY_BUILD_DTO,
): Promise<number> {
  const res: Response = await request(app.getHttpServer() as App)
    .post('/builds')
    .set('Authorization', `Bearer ${token}`)
    .send(dto);

  const body = res.body as { id: number };
  return body.id;
}

async function publishBuild(
  app: INestApplication,
  token: string,
  buildId: number,
): Promise<void> {
  await request(app.getHttpServer() as App)
    .patch(`/publish/${buildId}`)
    .set('Authorization', `Bearer ${token}`);
}

describe('Builds (integration)', () => {
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

  describe('GET /builds/count', () => {
    it('returns 0 when there are no published builds', async () => {
      const count = parseInt(
        (
          await request(app.getHttpServer() as App)
            .get('/builds/count')
            .expect(200)
        ).text,
        10,
      );
      expect(count).toBe(0);
    });

    it('counts only published builds', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, buildId);
      await createBuild(app, token);

      const count = parseInt(
        (
          await request(app.getHttpServer() as App)
            .get('/builds/count')
            .expect(200)
        ).text,
        10,
      );
      expect(count).toBe(1);
    });
  });

  describe('POST /builds', () => {
    it('creates a draft build and returns 201 with published=false', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/builds')
        .set('Authorization', `Bearer ${token}`)
        .send(EMPTY_BUILD_DTO)
        .expect(201);

      const body = res.body as { id: number; name: string; published: boolean };
      expect(body.id).toEqual(expect.any(Number));
      expect(body.name).toBe('My Draft Build');
      expect(body.published).toBe(false);
    });

    it('persists the build in the DB', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      const build = await buildRepository.findOne({ where: { id: buildId } });
      expect(build).not.toBeNull();
      expect(build!.published).toBe(false);
    });

    it('creates a build with all optional components', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/builds')
        .set('Authorization', `Bearer ${token}`)
        .send(FULL_BUILD_DTO)
        .expect(201);

      const body = res.body as {
        cpu: { buildcoresId: string } | null;
        gpu: { buildcoresId: string } | null;
        rams: { component: { buildcoresId: string }; quantity: number }[];
      };
      expect(body.cpu?.buildcoresId).toBe(IDS.cpu);
      expect(body.gpu?.buildcoresId).toBe(IDS.gpu);
      expect(body.rams).toHaveLength(1);
      expect(body.rams[0].quantity).toBe(2);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .post('/builds')
        .send(EMPTY_BUILD_DTO)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer() as App)
        .post('/builds')
        .set('Authorization', 'Bearer invalid.token.xyz')
        .send(EMPTY_BUILD_DTO)
        .expect(401);
    });

    it('returns 400 when name is missing', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/builds')
        .set('Authorization', `Bearer ${token}`)
        .send({ fanIds: [], monitorIds: [], ramIds: [], storageDriveIds: [] })
        .expect(400);
    });

    it('returns 400 when name exceeds 255 characters', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/builds')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...EMPTY_BUILD_DTO, name: 'a'.repeat(256) })
        .expect(400);
    });

    it('stores the description when provided', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/builds')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...EMPTY_BUILD_DTO, description: 'A great build' })
        .expect(201);

      const body = res.body as { description: string };
      expect(body.description).toBe('A great build');
    });
  });

  describe('GET /builds', () => {
    it('returns an empty paginated list when no builds are published', async () => {
      const { token } = await registerAndLogin(app);
      await createBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds')
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.data).toHaveLength(0);
      expect(body.total).toBe(0);
    });

    it('returns only published builds', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, buildId);
      await createBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds')
        .expect(200);

      const body = res.body as { data: { id: number }[]; total: number };
      expect(body.total).toBe(1);
      expect(body.data[0].id).toBe(buildId);
    });

    it('respects page and limit query params', async () => {
      const { token } = await registerAndLogin(app);
      const id1 = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, id1);
      const id2 = await createBuild(app, token, {
        ...FULL_BUILD_DTO,
        name: 'Second Build',
      });
      await publishBuild(app, token, id2);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds?page=1&limit=1')
        .expect(200);

      const body = res.body as {
        data: unknown[];
        total: number;
        page: number;
        limit: number;
      };
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(2);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(1);
    });

    it('returns the second page correctly', async () => {
      const { token } = await registerAndLogin(app);
      const id1 = await createBuild(app, token, {
        ...FULL_BUILD_DTO,
        name: 'Build A',
      });
      await publishBuild(app, token, id1);
      const id2 = await createBuild(app, token, {
        ...FULL_BUILD_DTO,
        name: 'Build B',
      });
      await publishBuild(app, token, id2);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds?page=2&limit=1&order=name-ASC')
        .expect(200);

      const body = res.body as { data: { name: string }[] };
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Build B');
    });

    it('orders builds by name ASC', async () => {
      const { token } = await registerAndLogin(app);
      for (const name of ['Zebra Build', 'Alpha Build', 'Middle Build']) {
        const id = await createBuild(app, token, { ...FULL_BUILD_DTO, name });
        await publishBuild(app, token, id);
      }

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds?order=name-ASC')
        .expect(200);

      const body = res.body as { data: { name: string }[] };
      const names = body.data.map((b) => b.name);
      expect(names).toEqual([...names].sort());
    });

    it('orders builds by name DESC', async () => {
      const { token } = await registerAndLogin(app);
      for (const name of ['Zebra Build', 'Alpha Build']) {
        const id = await createBuild(app, token, { ...FULL_BUILD_DTO, name });
        await publishBuild(app, token, id);
      }

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds?order=name-DESC')
        .expect(200);

      const body = res.body as { data: { name: string }[] };
      const names = body.data.map((b) => b.name);
      expect(names).toEqual([...names].sort().reverse());
    });

    it('does not expose unpublished builds to unauthenticated requests', async () => {
      const { token } = await registerAndLogin(app);
      await createBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds')
        .expect(200);

      const body = res.body as { data: unknown[] };
      expect(body.data).toHaveLength(0);
    });
  });

  describe('GET /builds/my-builds', () => {
    it('returns all builds (published and draft) for the current user', async () => {
      const { token } = await registerAndLogin(app);
      const draftId = await createBuild(app, token);
      const publishedId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, publishedId);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds/my-builds')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: { id: number }[]; total: number };
      const ids = body.data.map((b) => b.id);
      expect(ids).toContain(draftId);
      expect(ids).toContain(publishedId);
      expect(body.total).toBe(2);
    });

    it('does not return builds from other users', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      await createBuild(app, aliceToken);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/builds/my-builds')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(0);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .get('/builds/my-builds')
        .expect(401);
    });
  });

  describe('GET /builds/:id', () => {
    it('returns a published build to an unauthenticated user', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, buildId);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .expect(200);

      const body = res.body as { id: number; published: boolean };
      expect(body.id).toBe(buildId);
      expect(body.published).toBe(true);
    });

    it('returns own unpublished build to its owner', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { id: number; published: boolean };
      expect(body.id).toBe(buildId);
      expect(body.published).toBe(false);
    });

    it("returns 403 when accessing another user's unpublished build", async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(403);
    });

    it('returns 403 when an unauthenticated user tries to access an unpublished build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .expect(403);
    });

    it('returns 404 when the build does not exist', async () => {
      await request(app.getHttpServer() as App)
        .get('/builds/99999')
        .expect(404);
    });

    it('returns 400 when the id is not a number', async () => {
      await request(app.getHttpServer() as App)
        .get('/builds/not-a-number')
        .expect(400);
    });

    it('includes component data in the response', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as {
        cpu: { buildcoresId: string } | null;
        gpu: { buildcoresId: string } | null;
        rams: unknown[];
        storageDrives: unknown[];
        fans: unknown[];
        monitors: unknown[];
      };
      expect(body.cpu?.buildcoresId).toBe(IDS.cpu);
      expect(body.gpu?.buildcoresId).toBe(IDS.gpu);
      expect(body.rams).toHaveLength(1);
      expect(body.storageDrives).toHaveLength(1);
      expect(body.fans).toHaveLength(1);
      expect(body.monitors).toHaveLength(1);
    });
  });

  describe('PUT /builds/:id', () => {
    it('updates the build name and returns 200', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .put(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...EMPTY_BUILD_DTO, name: 'Updated Name' })
        .expect(200);

      const body = res.body as { name: string };
      expect(body.name).toBe('Updated Name');
    });

    it('persists the update in the DB', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .put(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...EMPTY_BUILD_DTO, name: 'Persisted Name' })
        .expect(200);

      const build = await buildRepository.findOne({ where: { id: buildId } });
      expect(build!.name).toBe('Persisted Name');
    });

    it('replaces components on update', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);

      const res: Response = await request(app.getHttpServer() as App)
        .put(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(EMPTY_BUILD_DTO)
        .expect(200);

      const body = res.body as { cpu: null; gpu: null; rams: unknown[] };
      expect(body.cpu).toBeNull();
      expect(body.gpu).toBeNull();
      expect(body.rams).toHaveLength(0);
    });

    it('returns 401 with no token', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .put(`/builds/${buildId}`)
        .send({ ...EMPTY_BUILD_DTO, name: 'Hacked' })
        .expect(401);
    });

    it('returns 403 when another user tries to update the build', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .put(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ ...EMPTY_BUILD_DTO, name: 'Hacked' })
        .expect(403);
    });

    it('returns 409 when trying to update a published build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, buildId);

      await request(app.getHttpServer() as App)
        .put(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...EMPTY_BUILD_DTO, name: 'New Name' })
        .expect(409);
    });

    it('returns 400 when name is missing', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .put(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fanIds: [], monitorIds: [], ramIds: [], storageDriveIds: [] })
        .expect(400);
    });

    it('returns 400 when the id is not a number', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .put('/builds/not-a-number')
        .set('Authorization', `Bearer ${token}`)
        .send(EMPTY_BUILD_DTO)
        .expect(400);
    });
  });

  describe('DELETE /builds/:id', () => {
    it('deletes own build and returns 204', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .delete(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('removes the build from the DB', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .delete(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const build = await buildRepository.findOne({ where: { id: buildId } });
      expect(build).toBeNull();
    });

    it('returns 401 with no token', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .delete(`/builds/${buildId}`)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .delete(`/builds/${buildId}`)
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });

    it('returns 403 when another user tries to delete the build', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .delete(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(403);
    });

    it('returns 404 when the build does not exist', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .delete('/builds/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 400 when the id is not a number', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .delete('/builds/not-a-number')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('PATCH /builds/assign_component', () => {
    it('assigns a single component (gpu) to the build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(204);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { gpu: { buildcoresId: string } | null };
      expect(body.gpu?.buildcoresId).toBe(IDS.gpu);
    });

    it('assigns a multi-component (ram) incrementing quantity on duplicate', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.ram, buildId, componentType: 'ram' })
        .expect(204);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.ram, buildId, componentType: 'ram' })
        .expect(204);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { rams: { quantity: number }[] };
      expect(body.rams).toHaveLength(1);
      expect(body.rams[0].quantity).toBe(2);
    });

    it('adds a second distinct multi-component entry', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      for (const id of [IDS.ram, IDS.ram2]) {
        await request(app.getHttpServer() as App)
          .patch('/builds/assign_component')
          .set('Authorization', `Bearer ${token}`)
          .send({ componentId: id, buildId, componentType: 'ram' })
          .expect(204);
      }

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { rams: unknown[] };
      expect(body.rams).toHaveLength(2);
    });

    it('returns 401 with no token', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(401);
    });

    it('returns 403 when another user tries to assign a component', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(403);
    });

    it('returns 409 when trying to assign a component to a published build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, buildId);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(409);
    });

    it('returns 400 for an unknown component type', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'unknownType' })
        .expect(400);
    });
  });

  describe('PATCH /builds/remove_component', () => {
    it('removes a single component (gpu) from the build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);

      await request(app.getHttpServer() as App)
        .patch('/builds/remove_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(204);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { gpu: null };
      expect(body.gpu).toBeNull();
    });

    it('decrements quantity for a multi-component when quantity > 1', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer() as App)
          .patch('/builds/assign_component')
          .set('Authorization', `Bearer ${token}`)
          .send({ componentId: IDS.ram, buildId, componentType: 'ram' })
          .expect(204);
      }

      await request(app.getHttpServer() as App)
        .patch('/builds/remove_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.ram, buildId, componentType: 'ram' })
        .expect(204);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { rams: { quantity: number }[] };
      expect(body.rams).toHaveLength(1);
      expect(body.rams[0].quantity).toBe(1);
    });

    it('removes the RAM entry entirely when quantity reaches zero', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.ram, buildId, componentType: 'ram' })
        .expect(204);

      await request(app.getHttpServer() as App)
        .patch('/builds/remove_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.ram, buildId, componentType: 'ram' })
        .expect(204);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { rams: unknown[] };
      expect(body.rams).toHaveLength(0);
    });

    it('returns 401 with no token', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);

      await request(app.getHttpServer() as App)
        .patch('/builds/remove_component')
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(401);
    });

    it('returns 403 when another user tries to remove a component', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createBuild(app, aliceToken, FULL_BUILD_DTO);

      await request(app.getHttpServer() as App)
        .patch('/builds/remove_component')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(403);
    });

    it('returns 409 when trying to remove from a published build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, buildId);

      await request(app.getHttpServer() as App)
        .patch('/builds/remove_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(409);
    });

    it('returns 404 when the component is not in the build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch('/builds/remove_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.ram, buildId, componentType: 'ram' })
        .expect(404);
    });
  });

  describe('GET /builds/unpublished/:cType/:cId', () => {
    it('returns unpublished builds with component count for the current user', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token);

      await request(app.getHttpServer() as App)
        .patch('/builds/assign_component')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, buildId, componentType: 'gpu' })
        .expect(204);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/unpublished/gpu/${IDS.gpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { build: { id: number }; quantity: number }[];
      expect(body).toHaveLength(1);
      expect(body[0].build.id).toBe(buildId);
      expect(body[0].quantity).toBe(1);
    });

    it('returns quantity 0 when the component is not in the build', async () => {
      const { token } = await registerAndLogin(app);
      await createBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/unpublished/gpu/${IDS.gpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { quantity: number }[];
      expect(body).toHaveLength(1);
      expect(body[0].quantity).toBe(0);
    });

    it('does not include published builds in the result', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createBuild(app, token, FULL_BUILD_DTO);
      await publishBuild(app, token, buildId);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/builds/unpublished/gpu/${IDS.gpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as unknown[];
      expect(body).toHaveLength(0);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .get(`/builds/unpublished/gpu/${IDS.gpu}`)
        .expect(401);
    });
  });
});
