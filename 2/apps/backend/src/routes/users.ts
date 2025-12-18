import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Student } from '../entities/Student';
import { ChangeHistory } from '../entities/ChangeHistory';
import { Enrollment } from '../entities/Enrollment';
import { authenticate, checkBlacklist } from '../middleware/auth';
import { logStudentChanges } from '../utils/history';

const router = Router();

router.get('/me/history', authenticate, checkBlacklist, async (req, res) => {
  const user = req.user as any;
  // If user is student, find by studentNumber
  if (user.role === 'student') {
    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({ where: { studentNumber: user.username } });
    if (!student) return res.json([]);
    
    const historyRepo = AppDataSource.getRepository(ChangeHistory);
    const items = await historyRepo.find({
      where: { student: { id: student.id } },
      order: { changedAt: 'DESC' }
    });
    return res.json(items);
  }
  return res.json([]);
});

router.get('/me/courses', authenticate, checkBlacklist, async (req, res) => {
  const user = req.user as any;
  if (user.role !== 'student') return res.json([]);
  
  const studentRepo = AppDataSource.getRepository(Student);
  const student = await studentRepo.findOne({ 
    where: { studentNumber: user.username },
    relations: ['enrollments', 'enrollments.course']
  });
  
  if (!student) return res.json([]);
  
  // Return courses with enrollment status
  const courses = student.enrollments.map(e => ({
    ...e.course,
    enrollmentStatus: e.status,
    enrollmentId: e.id
  }));
  
  res.json(courses);
});

router.get('/me', authenticate, checkBlacklist, async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: (req.user as any).sub } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ id: user.id, username: user.username, role: user.role.name, email: user.email, phone: user.phone, address: user.address });
});

router.put('/me', authenticate, checkBlacklist, async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: (req.user as any).sub } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  
  const { email, phone, address } = req.body || {};
  
  // If student, sync to Student entity and log history
  if (user.role.name === 'student') {
    const studentRepo = AppDataSource.getRepository(Student);
    const student = await studentRepo.findOne({ where: { studentNumber: user.username } });
    if (student) {
      const updates: Partial<Student> = {};
      if (email !== undefined) updates.contactEmail = email;
      if (phone !== undefined) updates.contactPhone = phone;
      if (address !== undefined) updates.address = address;

      await logStudentChanges(student, updates, user.username);
      
      Object.assign(student, updates);
      await studentRepo.save(student);
    }
  }

  user.email = email ?? user.email;
  user.phone = phone ?? user.phone;
  user.address = address ?? user.address;
  await repo.save(user);
  res.json({ id: user.id, username: user.username, role: user.role.name, email: user.email, phone: user.phone, address: user.address });
});

export default router;

