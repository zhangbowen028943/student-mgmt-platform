import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { Student } from '../entities/Student';
import { Course } from '../entities/Course';
import { authenticate, checkBlacklist, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (req, res) => {
  const { studentId, courseId, status, note } = req.body || {};
  const sRepo = AppDataSource.getRepository(Student);
  const cRepo = AppDataSource.getRepository(Course);
  const aRepo = AppDataSource.getRepository(Attendance);
  const student = await sRepo.findOne({ where: { id: Number(studentId) } });
  const course = await cRepo.findOne({ where: { id: Number(courseId) } });
  if (!student || !course) return res.status(400).json({ message: 'invalid student or course' });
  const att = aRepo.create({ student, course, status: status || 'present', note: note ?? null });
  await aRepo.save(att);
  res.status(201).json(att);
});

router.get('/', authenticate, checkBlacklist, async (req, res) => {
  const { studentId, courseId } = req.query as any;
  const repo = AppDataSource.getRepository(Attendance);
  const qb = repo.createQueryBuilder('a').leftJoinAndSelect('a.student', 'student').leftJoinAndSelect('a.course', 'course');
  if (studentId) qb.andWhere('student.id = :sid', { sid: Number(studentId) });
  if (courseId) qb.andWhere('course.id = :cid', { cid: Number(courseId) });
  const items = await qb.getMany();
  res.json(items);
});

router.put('/:id', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (req, res) => {
  const repo = AppDataSource.getRepository(Attendance);
  const att = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!att) return res.status(404).json({ message: 'Not found' });
  att.status = req.body.status ?? att.status;
  att.note = req.body.note ?? att.note;
  await repo.save(att);
  res.json(att);
});

router.delete('/:id', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (req, res) => {
  const repo = AppDataSource.getRepository(Attendance);
  const att = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!att) return res.status(404).json({ message: 'Not found' });
  await repo.remove(att);
  res.json({ message: 'Deleted' });
});

router.get('/warnings', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (_req, res) => {
  const repo = AppDataSource.getRepository(Attendance);
  const items = await repo.find();
  const map: Record<number, number> = {};
  for (const i of items) {
    if (i.status === 'absent') {
      const sid = (i.student as any).id;
      map[sid] = (map[sid] || 0) + 1;
    }
  }
  const warnings = Object.entries(map).filter(([_, count]) => count >= 3).map(([sid, count]) => ({ studentId: Number(sid), absentCount: count }));
  res.json(warnings);
});

export default router;

