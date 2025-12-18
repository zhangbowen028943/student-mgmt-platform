import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { config } from './config';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adminStudentRoutes from './routes/admin/students';
import adminUserRoutes from './routes/admin/users';
import courseRoutes from './routes/courses';
import fileRoutes from './routes/files';
import gradeRoutes from './routes/grades';
import attendanceRoutes from './routes/attendance';
import assignmentRoutes from './routes/assignments';
import { swaggerSpec } from './swagger';
import swaggerUi from 'swagger-ui-express';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  if (config.security.csrfEnabled) {
    app.use(csurf({ cookie: true }));
    app.get('/api/csrf-token', (req, res) => {
      res.json({ csrfToken: (req as any).csrfToken() });
    });
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin/students', adminStudentRoutes);
  app.use('/api/admin/users', adminUserRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/grades', gradeRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/assignments', assignmentRoutes);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  return app;
}
