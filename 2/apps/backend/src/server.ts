import { createApp } from './app';
import { config } from './config';
import { AppDataSource } from './data-source';
import schedule from 'node-schedule';
import { Client } from 'minio';

async function bootstrap() {
  await AppDataSource.initialize();

  const minio = new Client({
    endPoint: config.minio.endpoint,
    port: config.minio.port,
    useSSL: false,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey
  });
  try {
    const exists = await minio.bucketExists(config.minio.bucket);
    if (!exists) await minio.makeBucket(config.minio.bucket);
  } catch {}

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });

  schedule.scheduleJob('0 0 * * *', () => {
    console.log('Daily report generation job triggered');
  });
}

bootstrap().catch(err => {
  console.error('Failed to start backend', err);
  process.exit(1);
});
