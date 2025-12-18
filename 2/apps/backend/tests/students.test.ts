import request from 'supertest';
import { createApp } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Role } from '../src/entities/Role';
import bcrypt from 'bcrypt';

let app: ReturnType<typeof createApp>;
let adminToken = '';

beforeAll(async () => {
  await AppDataSource.initialize();
  const roleRepo = AppDataSource.getRepository(Role);
  let admin = await roleRepo.findOne({ where: { name: 'super_admin' } });
  if (!admin) {
    admin = roleRepo.create({ name: 'super_admin' });
    await roleRepo.save(admin);
  }
  const userRepo = AppDataSource.getRepository(User);
  const exists = await userRepo.findOne({ where: { username: 'admin' } });
  if (!exists) {
    const u = userRepo.create({
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: admin
    });
    await userRepo.save(u);
  }
  app = createApp();
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await AppDataSource.destroy();
});

test('admin can create and list students', async () => {
  const createRes = await request(app)
    .post('/api/admin/students')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ studentNumber: 'S1001', name: 'Alice', major: 'CS', grade: '2022' });
  expect(createRes.status).toBe(201);
  const listRes = await request(app)
    .get('/api/admin/students?page=1&pageSize=20&q=Alice')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(listRes.status).toBe(200);
  expect(listRes.body.items.length).toBeGreaterThan(0);
});

