import request from 'supertest';
import { createApp } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Role } from '../src/entities/Role';
import bcrypt from 'bcrypt';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await AppDataSource.initialize();
  const roleRepo = AppDataSource.getRepository(Role);
  let studentRole = await roleRepo.findOne({ where: { name: 'student' } });
  if (!studentRole) {
    studentRole = roleRepo.create({ name: 'student' });
    await roleRepo.save(studentRole);
  }
  const userRepo = AppDataSource.getRepository(User);
  const exists = await userRepo.findOne({ where: { username: 'test_user' } });
  if (!exists) {
    const u = userRepo.create({
      username: 'test_user',
      passwordHash: await bcrypt.hash('password123', 10),
      role: studentRole
    });
    await userRepo.save(u);
  }
  app = createApp();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

test('login should return tokens', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'test_user', password: 'password123' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
  expect(res.body.refreshToken).toBeTruthy();
});

