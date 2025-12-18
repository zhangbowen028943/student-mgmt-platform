import { Router } from 'express';
import { AppDataSource } from '../../data-source';
import { User } from '../../entities/User';
import { Role } from '../../entities/Role';
import { authenticate, checkBlacklist, requireRole } from '../../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();
router.use(authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin']));

router.get('/', async (_req, res) => {
  const repo = AppDataSource.getRepository(User);
  const items = await repo.find();
  res.json(items.map(u => ({ id: u.id, username: u.username, role: u.role.name, active: u.active })));
});

router.post('/', async (req, res) => {
  const { username, password, roleName } = req.body || {};
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const role = await roleRepo.findOne({ where: { name: roleName || 'student' } });
  if (!role) return res.status(400).json({ message: 'role invalid' });
  const u = userRepo.create({
    username,
    passwordHash: await bcrypt.hash(String(password || '123456'), 10),
    role
  });
  await userRepo.save(u);
  res.status(201).json({ id: u.id, username: u.username, role: u.role.name, active: u.active });
});

router.put('/:id', async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const u = await userRepo.findOne({ where: { id: Number(req.params.id) } });
  if (!u) return res.status(404).json({ message: 'Not found' });
  if (req.body.roleName) {
    const r = await roleRepo.findOne({ where: { name: req.body.roleName } });
    if (!r) return res.status(400).json({ message: 'role invalid' });
    u.role = r;
  }
  if (typeof req.body.active === 'boolean') u.active = req.body.active;
  await userRepo.save(u);
  res.json({ id: u.id, username: u.username, role: u.role.name, active: u.active });
});

router.delete('/:id', async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const u = await userRepo.findOne({ where: { id: Number(req.params.id) } });
  if (!u) return res.status(404).json({ message: 'Not found' });
  await userRepo.remove(u);
  res.json({ message: 'Deleted' });
});

export default router;

