import { Router } from 'express';
import multer from 'multer';
import { Client } from 'minio';
import { config } from '../config';
import { AppDataSource } from '../data-source';
import { Assignment } from '../entities/Assignment';
import { Course } from '../entities/Course';
import { authenticate, checkBlacklist, requireRole } from '../middleware/auth';

const router = Router();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });
const minio = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: false,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey
});

router.post('/', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), upload.single('file'), async (req, res) => {
  const { courseId, title, description } = req.body || {};
  const cRepo = AppDataSource.getRepository(Course);
  const aRepo = AppDataSource.getRepository(Assignment);
  const course = await cRepo.findOne({ where: { id: Number(courseId) } });
  if (!course) return res.status(400).json({ message: 'invalid course' });
  let key: string | null = null;
  if (req.file) {
    key = `${Date.now()}_${req.file.originalname}`;
    await minio.putObject(config.minio.bucket, key, req.file.buffer);
  }
  const a = aRepo.create({ course, title, description: description ?? null, fileKey: key });
  await aRepo.save(a);
  res.status(201).json(a);
});

router.get('/', authenticate, checkBlacklist, async (req, res) => {
  const { courseId } = req.query as any;
  const repo = AppDataSource.getRepository(Assignment);
  const qb = repo.createQueryBuilder('a').leftJoinAndSelect('a.course', 'course');
  if (courseId) qb.andWhere('course.id = :cid', { cid: Number(courseId) });
  const items = await qb.getMany();
  res.json(items);
});

export default router;

