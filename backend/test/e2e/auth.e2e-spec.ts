import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { createTestApp, closeTestApp } from '../test-app';
import { User } from '../../src/users/user.entity';
import { App } from 'supertest/types';

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
});
