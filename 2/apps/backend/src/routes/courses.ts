import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Course } from '../entities/Course';
import { Enrollment } from '../entities/Enrollment';
import { Student } from '../entities/Student';
import { authenticate, checkBlacklist, requireRole } from '../middleware/auth';

const router = Router();

function parseSlot(s: string | null) {
  if (!s) return null;
  const parts = s.split(' ');
  const day = parts[0];
  const times = parts[1]?.split('-') || [];
  const start = times[0] || '';
  const end = times[1] || '';
  return { day, start, end };
}

function overlaps(a: { day: string; start: string; end: string } | null, b: { day: string; start: string; end: string } | null) {
  if (!a || !b) return false;
  if (a.day !== b.day) return false;
  return !(a.end <= b.start || b.end <= a.start);
}

router.get('/', async (_req, res) => {
  const repo = AppDataSource.getRepository(Course);
  const items = await repo.find();
  res.json(items);
});

router.post('/', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (req, res) => {
  const repo = AppDataSource.getRepository(Course);
  const course = repo.create(req.body);
  await repo.save(course);
  res.status(201).json(course);
});

router.put('/:id', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (req, res) => {
  const repo = AppDataSource.getRepository(Course);
  const course = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!course) return res.status(404).json({ message: 'Not found' });
  Object.assign(course, req.body);
  await repo.save(course);
  res.json(course);
});

router.delete('/:id', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin']), async (req, res) => {
  const repo = AppDataSource.getRepository(Course);
  const course = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!course) return res.status(404).json({ message: 'Not found' });
  await repo.remove(course);
  res.json({ message: 'Deleted' });
});

router.post('/:id/enroll', authenticate, checkBlacklist, requireRole(['student']), async (req, res) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const enrollRepo = AppDataSource.getRepository(Enrollment);
  const studentRepo = AppDataSource.getRepository(Student);

  // Find student
  const student = await studentRepo.findOne({ where: { studentNumber: (req.user as any).username } });
  if (!student) return res.status(404).json({ message: 'Student profile not found' });

  const course = await courseRepo.findOne({ where: { id: Number(req.params.id) } });
  if (!course) return res.status(404).json({ message: 'Course not found' });

  // Check if already enrolled
  const currentEnrollment = await enrollRepo.findOne({ where: { course: { id: course.id }, student: { id: student.id } } });
  if (currentEnrollment) return res.status(400).json({ message: 'Already enrolled/waitlisted' });

  // Check capacity
  const count = await enrollRepo.count({ where: { course: { id: course.id }, status: 'enrolled' } });
  
  // Check conflicts
  const existing = await enrollRepo.find({ 
    where: { student: { id: student.id }, status: 'enrolled' },
    relations: ['course']
  });
  
  const targetSlot = parseSlot(course.timeSlot);
  for (const e of existing) {
    const otherSlot = parseSlot(e.course.timeSlot);
    if (overlaps(targetSlot as any, otherSlot as any)) {
      return res.status(400).json({ message: `Schedule conflict with ${e.course.name}` });
    }
  }

  const status = count < course.capacity ? 'enrolled' : 'waitlisted';
  const enrollment = enrollRepo.create({ course, student, status });
  await enrollRepo.save(enrollment);
  res.status(201).json(enrollment);
});

import { Grade } from '../entities/Grade';

router.get('/:id/students', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (req, res) => {
  const enrollRepo = AppDataSource.getRepository(Enrollment);
  const gradeRepo = AppDataSource.getRepository(Grade);
  
  // Get all enrolled students
  const enrollments = await enrollRepo.find({
    where: { course: { id: Number(req.params.id) }, status: 'enrolled' },
    relations: ['student']
  });
  
  // Get existing grades
  const grades = await gradeRepo.find({
    where: { course: { id: Number(req.params.id) } },
    relations: ['student']
  });
  
  const result = enrollments.map(e => {
    const g = grades.find(g => g.student.id === e.student.id);
    return {
      student: e.student,
      grade: g ? { score: g.score, comment: g.comment } : null
    };
  });
  
  res.json(result);
});

export default router;
