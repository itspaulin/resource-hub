import { AppModule } from '@/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UserFactory } from 'test/factories/make-user';
import { describe, beforeAll, afterAll, it, expect, beforeEach } from 'vitest';

describe('Create Account (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  beforeEach(async () => {
    // Limpa a tabela de usuários antes de cada teste para evitar conflitos
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /accounts - should create account successfully', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '123456',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(201);

    // Verifica se o usuário foi criado no banco de dados
    const userOnDatabase = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.name).toBe(userData.name);
    expect(userOnDatabase?.email).toBe(userData.email);
    expect(userOnDatabase?.password).not.toBe(userData.password); // Senha deve estar hasheada
  });

  it('[POST] /accounts - should not create account with duplicate email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '123456',
    };

    // Cria primeiro usuário
    await userFactory.makePrismaUser({
      email: userData.email,
      name: 'Existing User',
      password: 'hashedpassword',
    });

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /accounts - should validate required name field', async () => {
    const userData = {
      email: 'john.doe@example.com',
      password: '123456',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /accounts - should validate required email field', async () => {
    const userData = {
      name: 'John Doe',
      password: '123456',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /accounts - should validate required password field', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /accounts - should validate email format', async () => {
    const userData = {
      name: 'John Doe',
      email: 'invalid-email-format',
      password: '123456',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /accounts - should handle empty request body', async () => {
    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /accounts - should create account with valid email variations', async () => {
    const testEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.com',
      'user123@example-domain.com',
    ];

    for (let i = 0; i < testEmails.length; i++) {
      const userData = {
        name: `User ${i + 1}`,
        email: testEmails[i],
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/accounts')
        .send(userData);

      expect(response.statusCode).toBe(201);

      // Verifica se o usuário foi criado
      const userOnDatabase = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(userOnDatabase).toBeTruthy();
      expect(userOnDatabase?.email).toBe(userData.email);
    }
  });

  it('[POST] /accounts - should create account with clean data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '123456',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(201);

    const userOnDatabase = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.name).toBe(userData.name);
    expect(userOnDatabase?.email).toBe(userData.email);
  });

  it('[POST] /accounts - should handle special characters in name', async () => {
    const userData = {
      name: 'José da Silva-Santos',
      email: 'jose@example.com',
      password: '123456',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(201);

    const userOnDatabase = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.name).toBe(userData.name);
  });

  it('[POST] /accounts - should create multiple different accounts', async () => {
    const users = [
      { name: 'User One', email: 'user1@example.com', password: 'pass1' },
      { name: 'User Two', email: 'user2@example.com', password: 'pass2' },
      { name: 'User Three', email: 'user3@example.com', password: 'pass3' },
    ];

    for (const userData of users) {
      const response = await request(app.getHttpServer())
        .post('/accounts')
        .send(userData);

      expect(response.statusCode).toBe(201);
    }

    // Verifica se todos os usuários foram criados
    const usersOnDatabase = await prisma.user.findMany();
    expect(usersOnDatabase).toHaveLength(users.length);

    for (const userData of users) {
      const userOnDatabase = usersOnDatabase.find(
        (user) => user.email === userData.email,
      );
      expect(userOnDatabase).toBeTruthy();
      expect(userOnDatabase?.name).toBe(userData.name);
    }
  });

  it('[POST] /accounts - should set default role as user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '123456',
    };

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(userData);

    expect(response.statusCode).toBe(201);

    const userOnDatabase = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(userOnDatabase).toBeTruthy();
    // Assumindo que o role padrão é 'USER' - ajuste conforme sua implementação
    expect(userOnDatabase?.role).toBe('USER');
  });
});
