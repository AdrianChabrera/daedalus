import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { createTestApp, closeTestApp } from '../test-app';
import { User } from '../../src/users/user.entity';
import { Build } from '../../src/builds/entities/build.entity';
import { Review } from '../../src/reviews/entities/review.entity';
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
  storageDrive: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c',
  fan: 'd0e1f2a3-b4c5-4d6e-bf7a-8b9c0d1e2f3a',
  monitor: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
};

const FULL_BUILD_DTO = {
  name: 'Full Build',
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
      manufacturer: 'Intel',
      includesCooler: false,
      integratedGraphics: null,
    }),
  );
  await coolerRepo.save(
    Object.assign(new CpuCooler(), {
      buildcoresId: IDS.cpuCooler,
      name: 'Test Cooler',
      manufacturer: 'Noctua',
    }),
  );
  await gpuRepo.save(
    Object.assign(new Gpu(), {
      buildcoresId: IDS.gpu,
      name: 'Test GPU',
      manufacturer: 'NVIDIA',
    }),
  );
  await mbRepo.save(
    Object.assign(new Motherboard(), {
      buildcoresId: IDS.motherboard,
      name: 'Test Motherboard',
      manufacturer: 'ASUS',
    }),
  );
  await caseRepo.save(
    Object.assign(new PcCase(), {
      buildcoresId: IDS.pcCase,
      name: 'Test Case',
      manufacturer: 'NZXT',
      powerSupply: 'None',
    }),
  );
  await psuRepo.save(
    Object.assign(new PowerSupply(), {
      buildcoresId: IDS.powerSupply,
      name: 'Test PSU',
      manufacturer: 'Corsair',
    }),
  );
  await ramRepo.save(
    Object.assign(new Ram(), {
      buildcoresId: IDS.ram,
      name: 'Test RAM',
      manufacturer: 'G.Skill',
    }),
  );
  await storageRepo.save(
    Object.assign(new StorageDrive(), {
      buildcoresId: IDS.storageDrive,
      name: 'Test SSD',
      manufacturer: 'Samsung',
    }),
  );
  await fanRepo.save(
    Object.assign(new Fan(), {
      buildcoresId: IDS.fan,
      name: 'Test Fan',
      manufacturer: 'be quiet!',
    }),
  );
  await monitorRepo.save(
    Object.assign(new Monitor(), {
      buildcoresId: IDS.monitor,
      name: 'Test Monitor',
      manufacturer: 'LG',
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
  dto: object = FULL_BUILD_DTO,
): Promise<number> {
  const createRes: Response = await request(app.getHttpServer() as App)
    .post('/builds')
    .set('Authorization', `Bearer ${token}`)
    .send(dto);

  const buildId = (createRes.body as { id: number }).id;

  await request(app.getHttpServer() as App)
    .patch(`/publish/${buildId}`)
    .set('Authorization', `Bearer ${token}`);

  return buildId;
}

describe('Reviews (integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let buildRepository: Repository<Build>;
  let reviewRepository: Repository<Review>;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    buildRepository = app.get<Repository<Build>>(getRepositoryToken(Build));
    reviewRepository = app.get<Repository<Review>>(getRepositoryToken(Review));
    await seedComponents(app);
  });

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await reviewRepository.query('TRUNCATE TABLE "reviews" CASCADE');
    await buildRepository.query('TRUNCATE TABLE "builds" CASCADE');
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
  });

  afterEach(async () => {
    await reviewRepository.query('TRUNCATE TABLE "reviews" CASCADE');
    await buildRepository.query('TRUNCATE TABLE "builds" CASCADE');
    await userRepository.query('TRUNCATE TABLE "user" CASCADE');
  });

  describe('POST /reviews', () => {
    it('creates a build review and returns 201', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 4, text: 'Great build!' })
        .expect(201);

      const body = res.body as {
        id: number;
        stars: number;
        text: string;
        username: string;
      };
      expect(body.id).toEqual(expect.any(Number));
      expect(body.stars).toBe(4);
      expect(body.text).toBe('Great build!');
      expect(body.username).toBe('alice');
    });

    it('creates a component review and returns 201', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 })
        .expect(201);

      const body = res.body as {
        id: number;
        stars: number;
        componentType: string;
      };
      expect(body.id).toEqual(expect.any(Number));
      expect(body.stars).toBe(5);
      expect(body.componentType).toBe('gpu');
    });

    it('persists the review in the DB', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 3 })
        .expect(201);

      const { id } = res.body as { id: number };
      const review = await reviewRepository.findOne({ where: { id } });
      expect(review).not.toBeNull();
      expect(review!.stars).toBe(3);
    });

    it('allows a review without text (text is optional)', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 5 })
        .expect(201);

      const body = res.body as { text?: string | null };
      expect(body.text ?? undefined).toBeUndefined();
    });

    it('returns 400 when both buildId and componentId are provided', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, componentId: IDS.gpu, componentType: 'gpu', stars: 3 })
        .expect(400);
    });

    it('returns 400 when neither buildId nor componentId are provided', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ stars: 3 })
        .expect(400);
    });

    it('returns 400 when stars is missing', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId })
        .expect(400);
    });

    it('returns 400 when stars is below 1', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 0 })
        .expect(400);
    });

    it('returns 400 when stars is above 5', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 6 })
        .expect(400);
    });

    it('returns 400 when text exceeds 1000 characters', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 3, text: 'a'.repeat(1001) })
        .expect(400);
    });

    it('returns 400 when componentType is not a valid enum value', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'invalid-type', stars: 3 })
        .expect(400);
    });

    it('returns 409 when the user has already reviewed the same build', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 4 })
        .expect(201);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 2 })
        .expect(409);
    });

    it('returns 409 when the user has already reviewed the same component', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 })
        .expect(201);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 1 })
        .expect(409);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .post('/reviews')
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 })
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', 'Bearer invalid.token.xyz')
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 })
        .expect(401);
    });

    it('returns 404 when the build does not exist', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId: 99999, stars: 3 })
        .expect(404);
    });
  });

  describe('GET /reviews/builds/:bId', () => {
    it('returns a paginated list of reviews for a build', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ buildId, stars: 5, text: 'Amazing!' });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ buildId, stars: 3, text: 'Decent build' });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/builds/${buildId}`)
        .expect(200);

      const body = res.body as {
        data: unknown[];
        total: number;
        page: number;
        limit: number;
      };
      expect(body.total).toBe(2);
      expect(body.data).toHaveLength(2);
      expect(body.page).toBe(1);
      expect(body.limit).toEqual(expect.any(Number));
    });

    it('returns an empty list when there are no reviews', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/builds/${buildId}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(0);
      expect(body.data).toHaveLength(0);
    });

    it('respects page and limit query params', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createAndPublishBuild(app, aliceToken);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ buildId, stars: 5 });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ buildId, stars: 3 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/builds/${buildId}?page=1&limit=1`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(2);
    });

    it('sets hasCurrentUserReviewed=true when the authenticated user has reviewed', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 4 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/builds/${buildId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { hasCurrentUserReviewed: boolean };
      expect(body.hasCurrentUserReviewed).toBe(true);
    });

    it('sets hasCurrentUserReviewed=false when the authenticated user has not reviewed', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');
      const buildId = await createAndPublishBuild(app, aliceToken);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/builds/${buildId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { hasCurrentUserReviewed: boolean };
      expect(body.hasCurrentUserReviewed).toBe(false);
    });

    it('omits hasCurrentUserReviewed for unauthenticated requests', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/builds/${buildId}`)
        .expect(200);

      const body = res.body as { hasCurrentUserReviewed?: boolean };
      expect(body.hasCurrentUserReviewed).toBeUndefined();
    });

    it('returns 404 when the build does not exist', async () => {
      await request(app.getHttpServer() as App)
        .get('/reviews/builds/99999')
        .expect(404);
    });

    it('returns 400 when the build id is not a number', async () => {
      await request(app.getHttpServer() as App)
        .get('/reviews/builds/not-a-number')
        .expect(400);
    });
  });

  describe('GET /reviews/components/:cType/:cId', () => {
    it('returns a paginated list of reviews for a component', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          componentId: IDS.gpu,
          componentType: 'gpu',
          stars: 5,
          text: 'Best GPU ever',
        });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(2);
      expect(body.data).toHaveLength(2);
    });

    it('returns an empty list when there are no reviews for the component', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(0);
      expect(body.data).toHaveLength(0);
    });

    it('respects page and limit query params', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 3 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}?page=1&limit=1`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(2);
    });

    it('includes component name and manufacturer in each review', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}`)
        .expect(200);

      const body = res.body as {
        data: { componentName: string; manufacturerName: string }[];
      };
      expect(body.data[0].componentName).toBe('Test GPU');
      expect(body.data[0].manufacturerName).toBe('NVIDIA');
    });

    it('sets hasCurrentUserReviewed=true when the authenticated user has reviewed', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { hasCurrentUserReviewed: boolean };
      expect(body.hasCurrentUserReviewed).toBe(true);
    });

    it('sets hasCurrentUserReviewed=false when the authenticated user has not reviewed', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { hasCurrentUserReviewed: boolean };
      expect(body.hasCurrentUserReviewed).toBe(false);
    });

    it('omits hasCurrentUserReviewed for unauthenticated requests', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}`)
        .expect(200);

      const body = res.body as { hasCurrentUserReviewed?: boolean };
      expect(body.hasCurrentUserReviewed).toBeUndefined();
    });

    it('returns 400 when componentType is not a valid enum value', async () => {
      await request(app.getHttpServer() as App)
        .get(`/reviews/components/invalid-type/${IDS.gpu}`)
        .expect(400);
    });

    it('does not mix reviews across different component types', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/ram/${IDS.ram}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(0);
    });
  });

  describe('GET /reviews/my-reviews', () => {
    it('returns all reviews created by the current user', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 5 });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 3 });

      const res: Response = await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(2);
      expect(body.data).toHaveLength(2);
    });

    it('returns an empty list when the user has no reviews', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(0);
      expect(body.data).toHaveLength(0);
    });

    it('does not return reviews from other users', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      const res: Response = await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBe(0);
    });

    it('respects page and limit query params', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 5 });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 3 });

      const res: Response = await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(2);
    });

    it('orders reviews by createdAt DESC by default', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 2 });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 5 });

      const res: Response = await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: { createdAt: string }[] };
      const dates = body.data.map((r) => new Date(r.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('orders reviews by stars ASC when requested', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 1 });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      const res: Response = await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews?order=stars-ASC')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as { data: { stars: number }[] };
      expect(body.data[0].stars).toBe(1);
      expect(body.data[1].stars).toBe(5);
    });

    it('returns 400 for an invalid order parameter', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews?order=invalid-ASC')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('returns 401 with no token', async () => {
      await request(app.getHttpServer() as App)
        .get('/reviews/my-reviews')
        .expect(401);
    });
  });

  describe('DELETE /reviews/:reviewId', () => {
    it('deletes own review and returns 204', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 });

      const { id: reviewId } = res.body as { id: number };

      await request(app.getHttpServer() as App)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('removes the review from the DB', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 });

      const { id: reviewId } = res.body as { id: number };

      await request(app.getHttpServer() as App)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const review = await reviewRepository.findOne({
        where: { id: reviewId },
      });
      expect(review).toBeNull();
    });

    it('allows reviewing again after deleting a previous review', async () => {
      const { token } = await registerAndLogin(app);
      const buildId = await createAndPublishBuild(app, token);

      const createRes: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 3 });

      const { id: reviewId } = createRes.body as { id: number };

      await request(app.getHttpServer() as App)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ buildId, stars: 5 })
        .expect(201);
    });

    it('returns 403 when another user tries to delete the review', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      const { id: reviewId } = res.body as { id: number };

      await request(app.getHttpServer() as App)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(403);
    });

    it('returns 404 when the review does not exist', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .delete('/reviews/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 400 when the review id is not a number', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .delete('/reviews/not-a-number')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('returns 401 with no token', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 });

      const { id: reviewId } = res.body as { id: number };

      await request(app.getHttpServer() as App)
        .delete(`/reviews/${reviewId}`)
        .expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      const { token } = await registerAndLogin(app);

      const res: Response = await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 });

      const { id: reviewId } = res.body as { id: number };

      await request(app.getHttpServer() as App)
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', 'Bearer invalid.token.xyz')
        .expect(401);
    });
  });

  describe('GET /reviews/components/:cType/:cId/stats', () => {
    it('returns average and count for a component with reviews', async () => {
      const { token: aliceToken } = await registerAndLogin(app, 'alice');
      const { token: bobToken } = await registerAndLogin(app, 'bob');

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 4 });

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 2 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}/stats`)
        .expect(200);

      const body = res.body as { average: number; count: number };
      expect(body.count).toBe(2);
      expect(body.average).toBe(3);
    });

    it('returns null average and zero count when there are no reviews', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}/stats`)
        .expect(200);

      const body = res.body as { average: number | null; count: number };
      expect(body.average).toBeNull();
      expect(body.count).toBe(0);
    });

    it('does not mix stats across different component types', async () => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer() as App)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ componentId: IDS.gpu, componentType: 'gpu', stars: 5 });

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/ram/${IDS.ram}/stats`)
        .expect(200);

      const body = res.body as { average: number | null; count: number };
      expect(body.average).toBeNull();
      expect(body.count).toBe(0);
    });

    it('returns 400 when componentType is not a valid enum value', async () => {
      await request(app.getHttpServer() as App)
        .get(`/reviews/components/invalid-type/${IDS.gpu}/stats`)
        .expect(400);
    });

    it('returns the average rounded to 2 decimal places', async () => {
      const users = [
        await registerAndLogin(app, 'user1'),
        await registerAndLogin(app, 'user2'),
        await registerAndLogin(app, 'user3'),
      ];

      for (const [i, { token }] of users.entries()) {
        await request(app.getHttpServer() as App)
          .post('/reviews')
          .set('Authorization', `Bearer ${token}`)
          .send({ componentId: IDS.gpu, componentType: 'gpu', stars: i + 1 });
      }

      const res: Response = await request(app.getHttpServer() as App)
        .get(`/reviews/components/gpu/${IDS.gpu}/stats`)
        .expect(200);

      const body = res.body as { average: number; count: number };
      expect(body.count).toBe(3);
      expect(Number.isFinite(body.average)).toBe(true);
    });
  });
});
