import { Router } from 'express';
import multer from 'multer';
import { Client } from 'minio';
import { config } from '../config';
import { authenticate, checkBlacklist } from '../middleware/auth';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const minio = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: false,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey
});

router.post('/upload', authenticate, checkBlacklist, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file provided' });
  const key = `${Date.now()}_${req.file.originalname}`;
  await minio.putObject(config.minio.bucket, key, req.file.buffer);
  res.json({ key });
});

router.get('/download/:key', authenticate, checkBlacklist, async (req, res) => {
  const key = req.params.key;
  const stream = await minio.getObject(config.minio.bucket, key);
  stream.pipe(res);
});

export default router;

