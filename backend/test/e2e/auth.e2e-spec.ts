import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { createTestApp, closeTestApp } from '../test-app';
import { User } from '../../src/users/user.entity';
import { App } from 'supertest/types';
import { Cpu } from '../../src/components/entities/main-entities/cpu.entity';
import { Gpu } from '../../src/components/entities/main-entities/gpu.entity';
import { Ram } from '../../src/components/entities/main-entities/ram.entity';
import { StorageDrive } from '../../src/components/entities/main-entities/storage-drive.entity';
import { Motherboard } from '../../src/components/entities/main-entities/motherboard.entity';
import { PcCase } from '../../src/components/entities/main-entities/pc-case.entity';
import { PowerSupply } from '../../src/components/entities/main-entities/power-supply.entity';
import { CpuCooler } from '../../src/components/entities/main-entities/cpu-cooler.entity';

const COMPONENT_IDS = {
  cpu: '3f6c1e2a-4b5d-4a1e-8c2f-1a2b3c4d5e6f',
  cpuCooler: '7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
  gpu: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  motherboard: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
  pcCase: 'c3d4e5f6-a7b8-4c9d-ae0f-1a2b3c4d5e6f',
  powerSupply: 'd4e5f6a7-b8c9-4d0e-bf1a-2b3c4d5e6f7a',
  ram: 'e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b',
  storageDrive: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c',
};

async function seedComponentsForStats(app: INestApplication): Promise<void> {
  const cpuRepo = app.get<Repository<Cpu>>(getRepositoryToken(Cpu));
  const coolerRepo = app.get<Repository<CpuCooler>>(getRepositoryToken(CpuCooler));
  const gpuRepo = app.get<Repository<Gpu>>(getRepositoryToken(Gpu));
  const mbRepo = app.get<Repository<Motherboard>>(getRepositoryToken(Motherboard));
  const caseRepo = app.get<Repository<PcCase>>(getRepositoryToken(PcCase));
  const psuRepo = app.get<Repository<PowerSupply>>(getRepositoryToken(PowerSupply));
  const ramRepo = app.get<Repository<Ram>>(getRepositoryToken(Ram));
  const storageRepo = app.get<Repository<StorageDrive>>(getRepositoryToken(StorageDrive));

  await cpuRepo.save(
    Object.assign(new Cpu(), {
      buildcoresId: COMPONENT_IDS.cpu,
      name: 'Test CPU',
      includesCooler: false,
      integratedGraphics: null,
    }),
  );
  await coolerRepo.save(
    Object.assign(new CpuCooler(), {
      buildcoresId: COMPONENT_IDS.cpuCooler,
      name: 'Test Cooler',
    }),
  );
  await gpuRepo.save(
    Object.assign(new Gpu(), { buildcoresId: COMPONENT_IDS.gpu, name: 'Test GPU' }),
  );
  await mbRepo.save(
    Object.assign(new Motherboard(), {
      buildcoresId: COMPONENT_IDS.motherboard,
      name: 'Test Motherboard',
    }),
  );
  await caseRepo.save(
    Object.assign(new PcCase(), {
      buildcoresId: COMPONENT_IDS.pcCase,
      name: 'Test Case',
      powerSupply: 'None',
    }),
  );
  await psuRepo.save(
    Object.assign(new PowerSupply(), {
      buildcoresId: COMPONENT_IDS.powerSupply,
      name: 'Test PSU',
    }),
  );
  await ramRepo.save(
    Object.assign(new Ram(), { buildcoresId: COMPONENT_IDS.ram, name: 'Test RAM' }),
  );
  await storageRepo.save(
    Object.assign(new StorageDrive(), {
      buildcoresId: COMPONENT_IDS.storageDrive,
      name: 'Test SSD',
    }),
  );
}

async function publishBuild(app: INestApplication, token: string): Promise<number> {
  const res: Response = await request(app.getHttpServer() as App)
    .post('/publish')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Published Build',
      cpuId: COMPONENT_IDS.cpu,
      cpuCoolerId: COMPONENT_IDS.cpuCooler,
      gpuId: COMPONENT_IDS.gpu,
      motherboardId: COMPONENT_IDS.motherboard,
      pcCaseId: COMPONENT_IDS.pcCase,
      powerSupplyId: COMPONENT_IDS.powerSupply,
      fanIds: [],
      monitorIds: [],
      ramIds: [{ componentId: COMPONENT_IDS.ram, quantity: 1 }],
      storageDriveIds: [{ componentId: COMPONENT_IDS.storageDrive, quantity: 1 }],
    });
  const body = res.body as { id: number };
  return body.id;
}

describe('Auth (integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
  });

  afterEach(async () => {
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
  });

  describe('POST /auth/register', () => {
    it('registers a new user and returns an accessToken', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'password123' })
        .expect(201);

      const body = res.body as {
        accessToken: string;
        username: string;
        userId: number;
      };
      expect(body).toMatchObject({
        accessToken: expect.any(String) as unknown as string,
        username: 'alice',
        userId: expect.any(Number) as unknown as number,
      });
    });

    it('stores the password hashed in the DB (never plain text)', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'password123' })
        .expect(201);

      const user = await userRepository.findOneOrFail({
        where: { username: 'alice' },
      });
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[ab]\$/);
    });

    it('returns 409 if the username already exists', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'password123' });

      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'otherpassword' })
        .expect(409);
    });

    it('returns 400 if username is missing', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('returns 400 if password is shorter than 8 characters', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'short' })
        .expect(400);
    });

    it('returns 400 if username exceeds 255 characters', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'a'.repeat(256), password: 'password123' })
        .expect(400);
    });

    it('returns 400 if username is blank', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: '   ', password: 'password123' })
        .expect(400);
    });

    it('returns 400 if username contains spaces', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'ali ce', password: 'password123' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'password123' });
    });

    it('returns an accessToken with valid credentials', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({ username: 'alice', password: 'password123' })
        .expect(200);

      const body = res.body as {
        accessToken: string;
        username: string;
        userId: number;
      };
      expect(body).toMatchObject({
        accessToken: expect.any(String) as unknown as string,
        username: 'alice',
        userId: expect.any(Number) as unknown as number,
      });
    });

    it('returns a well-formed JWT as accessToken', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({ username: 'alice', password: 'password123' })
        .expect(200);

      const body = res.body as { accessToken: string };
      expect(body.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    it('returns 401 if the password is incorrect', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({ username: 'alice', password: 'wrongpassword' })
        .expect(401);
    });

    it('returns 401 if the user does not exist', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({ username: 'nobody', password: 'password123' })
        .expect(401);
    });

    it('returns 400 if the body is empty', async () => {
      await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;
    let userId: number;

    beforeEach(async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'password123' });

      const body = res.body as { accessToken: string; userId: number };
      accessToken = body.accessToken;
      userId = body.userId;
    });

    it('returns the authenticated user info', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as { username: string; password?: string };
      expect(body).toMatchObject({ username: 'alice' });
      expect(body.password).toBeUndefined();
    });

    it('returns the correct userId in the response', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as { userId: number };
      expect(body.userId).toBe(userId);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .get('/auth/me')
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer() as App)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });
  });

  describe('DELETE /auth/delete', () => {
    let accessToken: string;

    beforeEach(async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'password123' });

      const body = res.body as { accessToken: string };
      accessToken = body.accessToken;
    });

    it('deletes the authenticated user account', async () => {
      await request(app.getHttpServer() as App)
        .delete('/auth/delete')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const user = await userRepository.findOne({
        where: { username: 'alice' },
      });
      expect(user).toBeNull();
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .delete('/auth/delete')
        .expect(401);
    });

    it('returns 401 on GET /auth/me after account deletion', async () => {
      await request(app.getHttpServer() as App)
        .delete('/auth/delete')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app.getHttpServer() as App)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('returns 401 on login after account deletion', async () => {
      await request(app.getHttpServer() as App)
        .delete('/auth/delete')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({ username: 'alice', password: 'password123' })
        .expect(401);
    });

    it('token remains syntactically valid after account deletion but user no longer exists in DB', async () => {
      await request(app.getHttpServer() as App)
        .delete('/auth/delete')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const user = await userRepository.findOne({
        where: { username: 'alice' },
      });
      expect(user).toBeNull();
    });
  });

  describe('GET /auth/me/stats', () => {
    let accessToken: string;
    let aliceToken: string;
    let bobToken: string;

    beforeAll(async () => {
      await seedComponentsForStats(app);
    });

    beforeEach(async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'alice', password: 'password123' });

      const body = res.body as { accessToken: string };
      accessToken = body.accessToken;
      aliceToken = body.accessToken;

      const res2: Response = await request(app.getHttpServer() as App)
        .post('/auth/register')
        .send({ username: 'bob', password: 'password123' });

      const body2 = res2.body as { accessToken: string };
      bobToken = body2.accessToken;
    });

    it('returns 200 with a valid token', async () => {
      await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('returns all required stat fields with correct types', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as {
        buildsCount: number;
        favoriteBuildsCount: number;
        favoriteComponentsCount: number;
        reviewsCount: number;
        memberSince: string;
      };

      expect(body).toMatchObject({
        buildsCount: expect.any(Number) as unknown as number,
        favoriteBuildsCount: expect.any(Number) as unknown as number,
        favoriteComponentsCount: expect.any(Number) as unknown as number,
        reviewsCount: expect.any(Number) as unknown as number,
        memberSince: expect.any(String) as unknown as string,
      });
    });

    it('returns all zero counts for a brand-new user', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as {
        buildsCount: number;
        favoriteBuildsCount: number;
        favoriteComponentsCount: number;
        reviewsCount: number;
      };

      expect(body.buildsCount).toBe(0);
      expect(body.favoriteBuildsCount).toBe(0);
      expect(body.favoriteComponentsCount).toBe(0);
      expect(body.reviewsCount).toBe(0);
    });

    it('memberSince is a parseable ISO date string', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as { memberSince: string };
      const parsed = new Date(body.memberSince);
      expect(parsed.getTime()).not.toBeNaN();
    });

    it('reflects buildsCount after the user publishes a build', async () => {
      await publishBuild(app, aliceToken);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      const body = res.body as { buildsCount: number };
      expect(body.buildsCount).toBe(1);
    });

    it('reflects correct buildsCount after publishing multiple builds', async () => {
      await publishBuild(app, aliceToken);
      await publishBuild(app, aliceToken);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      const body = res.body as { buildsCount: number };
      expect(body.buildsCount).toBe(2);
    });

    it('does not count other users builds in buildsCount', async () => {
      await publishBuild(app, bobToken);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      const body = res.body as { buildsCount: number };
      expect(body.buildsCount).toBe(0);
    });

    it('reflects favoriteBuildsCount after favoriting a build', async () => {
      const buildId = await publishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { favoriteBuildsCount: number };
      expect(body.favoriteBuildsCount).toBe(1);
    });

    it('does not count other users favorite builds in favoriteBuildsCount', async () => {
      const buildId = await publishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      const body = res.body as { favoriteBuildsCount: number };
      expect(body.favoriteBuildsCount).toBe(0);
    });

    it('reflects favoriteComponentsCount after favoriting a component', async () => {
      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${COMPONENT_IDS.cpu}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      const body = res.body as { favoriteComponentsCount: number };
      expect(body.favoriteComponentsCount).toBe(1);
    });

    it('does not count other users favorite components in favoriteComponentsCount', async () => {
      await request(app.getHttpServer() as App)
        .post(`/favorites/components/cpu/${COMPONENT_IDS.cpu}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { favoriteComponentsCount: number };
      expect(body.favoriteComponentsCount).toBe(0);
    });

    it('reflects reviewsCount after the user leaves a review', async () => {
      const buildId = await publishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ stars: 5, text: 'Great build!', buildId })
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { reviewsCount: number };
      expect(body.reviewsCount).toBe(1);
    });

    it('does not count other users reviews in reviewsCount', async () => {
      const buildId = await publishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ stars: 5, text: 'Great build!', buildId })
        .expect(201);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      const body = res.body as { reviewsCount: number };
      expect(body.reviewsCount).toBe(0);
    });

    it('counts each stat independently and correctly when all are non-zero', async () => {
      const buildId = await publishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post(`/favorites/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);

      await request(app.getHttpServer() as App)
        .post(`/favorites/components/gpu/${COMPONENT_IDS.gpu}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(201);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ stars: 4, text: 'Solid build.', buildId })
        .expect(201);

      const bobBuildId = await publishBuild(app, bobToken);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as {
        buildsCount: number;
        favoriteBuildsCount: number;
        favoriteComponentsCount: number;
        reviewsCount: number;
      };

      expect(body.buildsCount).toBe(1);
      expect(body.favoriteBuildsCount).toBe(1);
      expect(body.favoriteComponentsCount).toBe(1);
      expect(body.reviewsCount).toBe(1);

      void bobBuildId;
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer() as App)
        .get('/auth/me/stats')
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });
  });
});