import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { createTestApp, closeTestApp } from '../test-app';
import { User } from '../../src/users/user.entity';
import { Build } from '../../src/builds/entities/build.entity';
import { Cpu } from '../../src/components/entities/main-entities/cpu.entity';
import { Gpu } from '../../src/components/entities/main-entities/gpu.entity';
import { UserFavoriteComponent } from '../../src/favorites/entities/userFavoriteComponent.entity';
import { App } from 'supertest/types';
import { StorageDrive } from '../../src/components/entities/main-entities/storage-drive.entity';
import { Ram } from '../../src/components/entities/main-entities/ram.entity';
import { CpuCooler } from '../../src/components/entities/main-entities/cpu-cooler.entity';
import { Motherboard } from '../../src/components/entities/main-entities/motherboard.entity';
import { PcCase } from '../../src/components/entities/main-entities/pc-case.entity';
import { PowerSupply } from '../../src/components/entities/main-entities/power-supply.entity';

const IDS = {
  cpu: '3f6c1e2a-4b5d-4a1e-8c2f-1a2b3c4d5e6f',
  gpu: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
};

async function seedComponents(app: INestApplication): Promise<void> {
  const cpuRepo = app.get<Repository<Cpu>>(getRepositoryToken(Cpu));
  const gpuRepo = app.get<Repository<Gpu>>(getRepositoryToken(Gpu));
  const coolerRepo = app.get<Repository<CpuCooler>>(
    getRepositoryToken(CpuCooler),
  );
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

  await cpuRepo.save(
    Object.assign(new Cpu(), {
      buildcoresId: IDS.cpu,
      name: 'Test CPU',
      includesCooler: false,
      integratedGraphics: null,
    }),
  );

  await gpuRepo.save(
    Object.assign(new Gpu(), { buildcoresId: IDS.gpu, name: 'Test GPU' }),
  );
  await coolerRepo.save(
    Object.assign(new CpuCooler(), {
      buildcoresId: '7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
      name: 'Test Cooler',
    }),
  );
  await mbRepo.save(
    Object.assign(new Motherboard(), {
      buildcoresId: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
      name: 'Test Motherboard',
    }),
  );
  await caseRepo.save(
    Object.assign(new PcCase(), {
      buildcoresId: 'c3d4e5f6-a7b8-4c9d-ae0f-1a2b3c4d5e6f',
      name: 'Test Case',
      powerSupply: 'None',
    }),
  );
  await psuRepo.save(
    Object.assign(new PowerSupply(), {
      buildcoresId: 'd4e5f6a7-b8c9-4d0e-bf1a-2b3c4d5e6f7a',
      name: 'Test PSU',
    }),
  );
  await ramRepo.save(
    Object.assign(new Ram(), {
      buildcoresId: 'e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b',
      name: 'Test RAM',
    }),
  );
  await storageRepo.save(
    Object.assign(new StorageDrive(), {
      buildcoresId: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c',
      name: 'Test SSD',
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

async function createAndPublishBuild(
  app: INestApplication,
  token: string,
): Promise<number> {
  const res: Response = await request(app.getHttpServer() as App)
    .post('/publish')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Published Build',
      cpuId: '3f6c1e2a-4b5d-4a1e-8c2f-1a2b3c4d5e6f',
      cpuCoolerId: '7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
      gpuId: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
      motherboardId: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
      pcCaseId: 'c3d4e5f6-a7b8-4c9d-ae0f-1a2b3c4d5e6f',
      powerSupplyId: 'd4e5f6a7-b8c9-4d0e-bf1a-2b3c4d5e6f7a',
      fanIds: [],
      monitorIds: [],
      ramIds: [
        { componentId: 'e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b', quantity: 1 },
      ],
      storageDriveIds: [
        { componentId: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c', quantity: 1 },
      ],
    });

  const body = res.body as { id: number };
  return body.id;
}

describe('Favorites (integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let buildRepository: Repository<Build>;
  let favoriteComponentRepository: Repository<UserFavoriteComponent>;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    buildRepository = app.get<Repository<Build>>(getRepositoryToken(Build));
    favoriteComponentRepository = app.get<Repository<UserFavoriteComponent>>(
      getRepositoryToken(UserFavoriteComponent),
    );
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

  describe('POST /favorites/components/:cType/:cId', () => {
    it('marks a component as favorite and returns 201', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    });

    it('persists the favorite in the DB', async () => {
      const { token, userId } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const fav = await favoriteComponentRepository.findOne({
        where: { user: { id: userId }, componentId: IDS.cpu },
        relations: { user: true },
      });
      expect(fav).not.toBeNull();
      expect(fav!.componentType).toBe('cpu');
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });

    it('returns 409 when the component is already a favorite', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('returns 400 with an invalid component type', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/invalid-type/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('allows two different users to favorite the same component', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(201);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);
    });
  });

  describe('DELETE /favorites/components/:cId', () => {
    it('removes a favorite component and returns 204', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app.getHttpServer() as App)
        .delete(`/favorites/components/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('removes the record from the DB', async () => {
      const { token, userId } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app.getHttpServer() as App)
        .delete(`/favorites/components/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const fav = await favoriteComponentRepository.findOne({
        where: { user: { id: userId }, componentId: IDS.cpu },
        relations: { user: true },
      });
      expect(fav).toBeNull();
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .delete(`/favorites/components/${IDS.cpu}`)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer() as App)
        .delete(`/favorites/components/${IDS.cpu}`)
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });

    it('returns 404 when the favorite does not exist', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .delete(`/favorites/components/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('GET /favorites/components/:cType', () => {
    it('returns the list of favorite components of the given type', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/favorites/components/cpu')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as {
        data: { buildcoresId: string }[];
        total: number;
      };
      expect(body.data).toHaveLength(1);
      expect(body.data[0].buildcoresId).toBe(IDS.cpu);
    });

    it('returns an empty list when no favorites exist for the type', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/favorites/components/cpu')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.data).toHaveLength(0);
    });

    it('does not return favorites from other types', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/gpu/${IDS.gpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/favorites/components/cpu')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: unknown[] };
      expect(body.data).toHaveLength(0);
    });

    it('does not return favorites from other users', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${IDS.cpu}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/favorites/components/cpu')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { data: unknown[] };
      expect(body.data).toHaveLength(0);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .get('/favorites/components/cpu')
        .expect(401);
    });

    it('returns 400 with an invalid component type', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .get('/favorites/components/invalid-type')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('POST /favorites/builds/:bId', () => {
    it('marks a published build as favorite and returns 201', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);
    });

    it('returns 401 with no token', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });

    it('returns 409 when the user tries to favorite their own build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('returns 409 when the build is not published', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      const res: Response = await request(app.getHttpServer() as App)
        .post('/builds')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Draft Build',
          fanIds: [],
          monitorIds: [],
          ramIds: [],
          storageDriveIds: [],
        });

      const body = res.body as { id: number };

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${body.id}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(409);
    });

    it('returns 404 when the build does not exist', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/favorites/builds/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 400 when the build id is not a number', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/favorites/builds/not-a-number')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('DELETE /favorites/builds/:bId', () => {
    it('removes a favorite build and returns 204', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);

      await request(app.getHttpServer() as App)
        .delete(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(204);
    });

    it('returns 401 with no token', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .delete(`/favorites/builds/${buildId}`)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .delete(`/favorites/builds/${buildId}`)
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });

    it('returns 400 when the build id is not a number', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .delete('/favorites/builds/not-a-number')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('GET /favorites/builds', () => {
    it('returns the list of favorite builds', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/favorites/builds')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { data: { id: number }[]; total: number };
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(buildId);
    });

    it('returns an empty list when no favorite builds exist', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/favorites/builds')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: unknown[] };
      expect(body.data).toHaveLength(0);
    });

    it('does not return favorite builds from other users', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const { token: charlieToken } = await registerAndLogin(app, 'charlie');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/favorites/builds')
        .set('Authorization', `Bearer ${charlieToken}`)
        .expect(200);

      const body = res.body as { data: unknown[] };
      expect(body.data).toHaveLength(0);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .get('/favorites/builds')
        .expect(401);
    });
  });
});
