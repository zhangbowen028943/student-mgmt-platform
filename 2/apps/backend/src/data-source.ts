import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from './entities/User';
import { Role } from './entities/Role';
import { Student } from './entities/Student';
import { Course } from './entities/Course';
import { Enrollment } from './entities/Enrollment';
import { Grade } from './entities/Grade';
import { Attendance } from './entities/Attendance';
import { Assignment } from './entities/Assignment';
import { TokenBlacklist } from './entities/TokenBlacklist';
import { AuditLog } from './entities/AuditLog';
import { ChangeHistory } from './entities/ChangeHistory';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  synchronize: true,
  logging: false,
  entities: [
    User, Role, Student, Course, Enrollment, Grade, Attendance, Assignment, TokenBlacklist, AuditLog, ChangeHistory
  ],
  subscribers: [],
  migrations: []
});

