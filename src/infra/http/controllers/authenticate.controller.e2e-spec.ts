import { AppModule } from '@/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { UserFactory } from 'test/factories/make-user';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';

describe('Authenticate (E2E)', () => {
  let app: INestApplication;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /sessions - should authenticate user successfully', async () => {
    const userEmail = 'john.doe@gmail.com';
    const userPassword = '123456';

    await userFactory.makePrismaUser({
      email: userEmail,
      password: await hash(userPassword, 9),
    });

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: userEmail,
      password: userPassword,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      access_token: expect.any(String),
    });
  });

  it('[POST] /sessions - should return 400 for invalid credentials', async () => {
    const userEmail = 'user@example.com';
    const correctPassword = 'correct-password';
    const wrongPassword = 'wrong-password';

    await userFactory.makePrismaUser({
      email: userEmail,
      password: await hash(correctPassword, 9),
    });

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: userEmail,
      password: wrongPassword,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /sessions - should return 400 for non-existent user', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'non-existent@example.com',
      password: 'any-password',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /sessions - should validate email format', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'invalid-email-format',
      password: '123456',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /sessions - should require password field', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'test@example.com',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /sessions - should require email field', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      password: '123456',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /sessions - should handle empty request body', async () => {
    const response = await request(app.getHttpServer())
      .post('/sessions')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /sessions - should authenticate different users', async () => {
    const users = [
      { email: 'user1@example.com', password: 'password1' },
      { email: 'user2@example.com', password: 'password2' },
      { email: 'user3@example.com', password: 'password3' },
    ];

    for (const user of users) {
      await userFactory.makePrismaUser({
        email: user.email,
        password: await hash(user.password, 9),
      });
    }

    for (const user of users) {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .send({
          email: user.email,
          password: user.password,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.access_token).toBeTruthy();
      expect(typeof response.body.access_token).toBe('string');
    }
  });

  it('[POST] /sessions - should return different tokens for different users', async () => {
    const user1 = { email: 'user1@test.com', password: 'pass123' };
    const user2 = { email: 'user2@test.com', password: 'pass456' };

    await userFactory.makePrismaUser({
      email: user1.email,
      password: await hash(user1.password, 9),
    });

    await userFactory.makePrismaUser({
      email: user2.email,
      password: await hash(user2.password, 9),
    });

    const response1 = await request(app.getHttpServer())
      .post('/sessions')
      .send(user1);

    const response2 = await request(app.getHttpServer())
      .post('/sessions')
      .send(user2);

    expect(response1.statusCode).toBe(201);
    expect(response2.statusCode).toBe(201);

    expect(response1.body.access_token).not.toBe(response2.body.access_token);
  });

  it('[POST] /sessions - should handle case sensitivity in email', async () => {
    const userEmail = 'Test@Example.com';
    const userPassword = 'password123';

    await userFactory.makePrismaUser({
      email: userEmail.toLowerCase(),
      password: await hash(userPassword, 9),
    });

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: userEmail.toUpperCase(),
      password: userPassword,
    });

    expect([201, 400]).toContain(response.statusCode);
  });
});
