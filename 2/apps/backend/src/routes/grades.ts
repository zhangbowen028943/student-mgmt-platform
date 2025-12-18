import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Grade } from '../entities/Grade';
import { Student } from '../entities/Student';
import { Course } from '../entities/Course';
import { authenticate, checkBlacklist, requireRole } from '../middleware/auth';
import PDFDocument from 'pdfkit';

const router = Router();

router.get('/transcript', authenticate, checkBlacklist, async (req, res) => {
  const user = req.user as any;
  // Only students can download their own, or admins can download for anyone (not implemented yet for admins)
  if (user.role !== 'student') return res.status(403).json({ message: 'Only students can download transcripts' });

  const sRepo = AppDataSource.getRepository(Student);
  const student = await sRepo.findOne({ where: { studentNumber: user.username } });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const gRepo = AppDataSource.getRepository(Grade);
  const grades = await gRepo.find({
    where: { student: { id: student.id } },
    relations: ['course']
  });

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=transcript_${student.studentNumber}.pdf`);

  doc.pipe(res);

  doc.fontSize(20).text('Academic Transcript', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${student.name}`);
  doc.text(`Student Number: ${student.studentNumber}`);
  doc.text(`Major: ${student.major || 'N/A'}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  // Table header
  const yStart = doc.y;
  doc.text('Course', 50, yStart);
  doc.text('Credits', 300, yStart);
  doc.text('Score', 400, yStart);
  
  doc.moveTo(50, yStart + 15).lineTo(500, yStart + 15).stroke();
  doc.moveDown();

  let y = doc.y + 10;
  let totalCredits = 0;
  let weightedScore = 0;

  for (const g of grades) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    doc.text(g.course.name, 50, y);
    doc.text(String(g.course.credits), 300, y);
    doc.text(g.score !== null ? String(g.score) : '-', 400, y);
    y += 20;

    if (g.score !== null) {
      totalCredits += g.course.credits;
      weightedScore += g.course.credits * g.score;
    }
  }

  doc.moveDown();
  doc.moveTo(50, y).lineTo(500, y).stroke();
  y += 20;
  
  const gpa = totalCredits > 0 ? (weightedScore / totalCredits).toFixed(2) : 'N/A';
  doc.fontSize(14).text(`Total Credits: ${totalCredits}`, 50, y);
  doc.text(`Average Score: ${gpa}`, 300, y);

  doc.end();
});

router.post('/', authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin', 'teacher']), async (req, res) => {
  const { studentId, courseId, score, comment } = req.body || {};
  const sRepo = AppDataSource.getRepository(Student);
  const cRepo = AppDataSource.getRepository(Course);
  const gRepo = AppDataSource.getRepository(Grade);
  const student = await sRepo.findOne({ where: { id: Number(studentId) } });
  const course = await cRepo.findOne({ where: { id: Number(courseId) } });
  if (!student || !course) return res.status(400).json({ message: 'invalid student or course' });
  const grade = gRepo.create({ student, course, score: score ?? null, comment: comment ?? null });
  await gRepo.save(grade);
  res.status(201).json(grade);
});

router.get('/', authenticate, checkBlacklist, async (req, res) => {
  const { studentId, courseId } = req.query as any;
  const gRepo = AppDataSource.getRepository(Grade);
  const qb = gRepo.createQueryBuilder('g').leftJoinAndSelect('g.student', 'student').leftJoinAndSelect('g.course', 'course');
  if (studentId) qb.andWhere('student.id = :sid', { sid: Number(studentId) });
  if (courseId) qb.andWhere('course.id = :cid', { cid: Number(courseId) });
  const items = await qb.getMany();
  res.json(items);
});

export default router;

