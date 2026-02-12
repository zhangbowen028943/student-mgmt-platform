import { Router } from 'express';
import { AppDataSource } from '../../data-source';
import { Student } from '../../entities/Student';
import { authenticate, checkBlacklist, requireRole } from '../../middleware/auth';
import { ChangeHistory } from '../../entities/ChangeHistory';
import { logStudentChanges } from '../../utils/history';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { STUDENT_CAPABILITIES } from '../../constants/studentCapabilities';
import { StudentCapability } from '../../entities/StudentCapability';

const router = Router();
const upload = multer();

router.use(authenticate, checkBlacklist, requireRole(['super_admin', 'department_admin']));

router.get('/capabilities/catalog', (_req, res) => {
  res.json({ items: STUDENT_CAPABILITIES, total: STUDENT_CAPABILITIES.length });
});

router.get('/:id/history', async (req, res) => {
  const repo = AppDataSource.getRepository(ChangeHistory);
  const items = await repo.find({
    where: { student: { id: Number(req.params.id) } },
    order: { changedAt: 'DESC' }
  });
  res.json(items);
});

router.get('/', async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const q = (req.query.q as string) || '';
  const repo = AppDataSource.getRepository(Student);
  const qb = repo.createQueryBuilder('s');
  if (q) {
    qb.where('s.name ILIKE :q OR s.studentNumber ILIKE :q OR s.major ILIKE :q', { q: `%${q}%` });
  }
  qb.skip((page - 1) * pageSize).take(pageSize).orderBy('s.updatedAt', 'DESC');
  const [items, total] = await qb.getManyAndCount();
  res.json({ items, total, page, pageSize });
});

router.post('/', async (req, res) => {
  const repo = AppDataSource.getRepository(Student);
  const student = repo.create(req.body);
  await repo.save(student);
  res.status(201).json(student);
});

router.put('/:id', async (req, res) => {
  const repo = AppDataSource.getRepository(Student);
  const student = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!student) return res.status(404).json({ message: 'Not found' });
  
  // Log changes
  await logStudentChanges(student, req.body, (req.user as any).username);

  Object.assign(student, req.body);
  await repo.save(student);
  res.json(student);
});

router.delete('/:id', async (req, res) => {
  const repo = AppDataSource.getRepository(Student);
  const student = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!student) return res.status(404).json({ message: 'Not found' });
  await repo.remove(student);
  res.json({ message: 'Deleted' });
});

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'file required' });
  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<any>(sheet);
  const repo = AppDataSource.getRepository(Student);
  const saved: Student[] = [];
  for (const r of rows) {
    const s = repo.create({
      studentNumber: String(r.studentNumber || r.学号),
      name: String(r.name || r.姓名),
      major: r.major || r.专业 || null,
      grade: r.grade || r.年级 || null,
      contactPhone: r.contactPhone || r.电话 || null,
      contactEmail: r.contactEmail || r.邮箱 || null,
      emergencyContact: r.emergencyContact || r.紧急联系人 || null,
      address: r.address || r.地址 || null
    });
    await repo.save(s);
    saved.push(s);
  }
  res.json({ count: saved.length });
});

router.get('/export', async (req, res) => {
  const idsParam = (req.query.ids as string) || '';
  const ids = idsParam ? idsParam.split(',').map(s => Number(s)).filter(n => !Number.isNaN(n)) : [];
  const repo = AppDataSource.getRepository(Student);
  const items = ids.length ? await repo.findBy({ id: ids as any }) : await repo.find();
  const data = items.map(s => ({
    studentNumber: s.studentNumber,
    name: s.name,
    major: s.major,
    grade: s.grade,
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    emergencyContact: s.emergencyContact,
    address: s.address
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'students');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
  res.send(buf);
});

router.get('/:id/capabilities', async (req, res) => {
  const studentId = Number(req.params.id);
  const studentRepo = AppDataSource.getRepository(Student);
  const capabilityRepo = AppDataSource.getRepository(StudentCapability);

  const student = await studentRepo.findOne({ where: { id: studentId } });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const records = await capabilityRepo.find({ where: { student: { id: studentId } as any } });
  const recordMap = new Map(records.map(record => [record.featureKey, record]));

  const items = STUDENT_CAPABILITIES.map(feature => {
    const record = recordMap.get(feature.key);
    return {
      ...feature,
      enabled: record?.enabled || false,
      progress: record?.progress || 0,
      notes: record?.notes || ''
    };
  });

  res.json({ studentId, total: items.length, items });
});

router.put('/:id/capabilities', async (req, res) => {
  const studentId = Number(req.params.id);
  const studentRepo = AppDataSource.getRepository(Student);
  const capabilityRepo = AppDataSource.getRepository(StudentCapability);

  const student = await studentRepo.findOne({ where: { id: studentId } });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const payload = Array.isArray(req.body?.items) ? req.body.items : [];
  const validKeys = new Set(STUDENT_CAPABILITIES.map(item => item.key));

  for (const item of payload) {
    if (!validKeys.has(item.featureKey)) {
      return res.status(400).json({ message: `Invalid featureKey: ${item.featureKey}` });
    }
  }

  const existing = await capabilityRepo.find({ where: { student: { id: studentId } as any } });
  const existingMap = new Map(existing.map(item => [item.featureKey, item]));

  for (const item of payload) {
    const found = existingMap.get(item.featureKey);
    const progress = Math.max(0, Math.min(100, Number(item.progress) || 0));
    const notes = item.notes ? String(item.notes).trim().slice(0, 500) : null;
    if (found) {
      found.enabled = Boolean(item.enabled);
      found.progress = progress;
      found.notes = notes;
      await capabilityRepo.save(found);
    } else {
      const created = capabilityRepo.create({
        student,
        featureKey: item.featureKey,
        enabled: Boolean(item.enabled),
        progress,
        notes
      });
      await capabilityRepo.save(created);
    }
  }

  const summary = await capabilityRepo.find({ where: { student: { id: studentId } as any } });
  const enabledCount = summary.filter(item => item.enabled).length;
  res.json({
    message: 'Capabilities saved',
    total: STUDENT_CAPABILITIES.length,
    enabledCount,
    completionRate: Math.round((enabledCount / STUDENT_CAPABILITIES.length) * 100)
  });
});

export default router;
