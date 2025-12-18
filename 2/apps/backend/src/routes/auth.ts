import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { TokenBlacklist } from '../entities/TokenBlacklist';
import Joi from 'joi';

const router = Router();

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { username: value.username } });
  if (!user || !user.active) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(value.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const payload = { sub: user.id, username: user.username, role: user.role.name };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
  return res.json({ token, refreshToken });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });
  try {
    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
    const token = jwt.sign({ sub: payload.sub, username: payload.username, role: payload.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    return res.json({ token });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(400).json({ message: 'Missing token' });
  const decoded: any = jwt.decode(token);
  const exp = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);
  const repo = AppDataSource.getRepository(TokenBlacklist);
  const entry = repo.create({ token, expiresAt: exp });
  await repo.save(entry);
  return res.json({ message: 'Logged out' });
});

router.post('/change-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body || {};
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { username } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  const ok = await bcrypt.compare(String(oldPassword || ''), user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Old password incorrect' });
  user.passwordHash = await bcrypt.hash(String(newPassword || ''), 10);
  await repo.save(user);
  return res.json({ message: 'Password changed' });
});

router.post('/forgot', async (req, res) => {
  const { username, newPassword } = req.body || {};
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { username } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  user.passwordHash = await bcrypt.hash(String(newPassword || ''), 10);
  await repo.save(user);
  return res.json({ message: 'Password reset' });
});

export default router;
