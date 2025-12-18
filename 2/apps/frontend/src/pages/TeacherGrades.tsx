import { useEffect, useState } from 'react';
import client from '../api/client';

interface Course {
  id: number;
  name: string;
}

interface Student {
  id: number;
  studentNumber: string;
  name: string;
}

export default function TeacherGrades() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  useEffect(() => {
    // Ideally should filter courses taught by this teacher
    client.get('/api/courses').then(res => setCourses(res.data));
  }, []);

  async function loadStudents() {
    if (!selectedCourseId) return;
    // Get enrollments for this course (need backend support or reuse grades API?)
    // Actually grades API returns existing grades, but we need all enrolled students.
    // Let's assume we can query grades which returns enrolled students for now if we don't have a specific endpoint
    // But wait, grades only exist if created. We need enrollments.
    // We don't have a public endpoint for course enrollments for teachers easily unless we use admin one or add one.
    // Let's use the grades endpoint first, but it might be empty.
    // Better: Add an endpoint to get enrolled students for a course.
    // For now, let's assume we can list all students and filter (inefficient) or just fetch grades.
    // Actually, let's try to use the admin/students endpoint if accessible, or maybe add a specific one.
    // Let's add a backend endpoint for this in the next step if needed.
    // Wait, we have `GET /api/grades?courseId=...`. If we pre-populate grades or join enrollments, that works.
    // Currently `GET /api/grades` returns existing grades.
    // Let's assume we implement a way to get enrolled students.
    // Let's use a temporary solution: Get all grades for the course. If a student is enrolled but has no grade, they might not show up?
    // We should probably add an endpoint `GET /api/courses/:id/students` for teachers.
    
    // For now, I'll just use the grades endpoint and assume it returns what we need or I will update backend.
    const res = await client.get(`/api/grades?courseId=${selectedCourseId}`);
    // If the backend `GET /api/grades` only returns `Grade` entities, we miss students without grades.
    // We need to fetch enrollments.
    // Let's look at `apps/backend/src/routes/courses.ts`. There is no endpoint to list enrollments for a course for teachers.
    // I should add `GET /api/courses/:id/students` in backend.
    
    // Placeholder for now
    setStudents(res.data.map((g: any) => g.student)); // This is wrong if no grades yet.
  }
  
  // Actually, I'll implement the backend change first to support this properly.
  // See next tool call.

  return (
    <div>
      <h1 className="text-xl mb-4">成绩录入</h1>
      <select 
        className="border px-3 py-2 mb-4"
        value={selectedCourseId}
        onChange={e => setSelectedCourseId(Number(e.target.value))}
      >
        <option value="">选择课程</option>
        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {selectedCourseId && (
        <TeacherCourseGrades courseId={selectedCourseId} />
      )}
    </div>
  );
}

function TeacherCourseGrades({ courseId }: { courseId: number }) {
  const [list, setList] = useState<any[]>([]);

  async function load() {
    // We need a proper endpoint. I will create `GET /api/courses/:id/students`
    const res = await client.get(`/api/courses/${courseId}/students`);
    setList(res.data);
  }

  useEffect(() => {
    load();
  }, [courseId]);

  async function updateGrade(studentId: number, score: number, comment: string) {
    await client.post('/api/grades', {
      studentId,
      courseId,
      score,
      comment
    });
    // Don't reload entire list to keep focus, maybe just toast
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">学号</th>
            <th className="p-2 border">姓名</th>
            <th className="p-2 border">分数</th>
            <th className="p-2 border">评价</th>
            <th className="p-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {list.map(s => (
            <GradeRow key={s.student.id} student={s.student} initialGrade={s.grade} courseId={courseId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GradeRow({ student, initialGrade, courseId }: any) {
  const [score, setScore] = useState(initialGrade?.score || '');
  const [comment, setComment] = useState(initialGrade?.comment || '');
  const [dirty, setDirty] = useState(false);

  async function save() {
    await client.post('/api/grades', {
      studentId: student.id,
      courseId,
      score: Number(score),
      comment
    });
    setDirty(false);
    alert('已保存');
  }

  return (
    <tr>
      <td className="p-2 border">{student.studentNumber}</td>
      <td className="p-2 border">{student.name}</td>
      <td className="p-2 border">
        <input 
          type="number" 
          className="border px-2 py-1 w-20" 
          value={score} 
          onChange={e => { setScore(e.target.value); setDirty(true); }} 
        />
      </td>
      <td className="p-2 border">
        <input 
          className="border px-2 py-1 w-full" 
          value={comment} 
          onChange={e => { setComment(e.target.value); setDirty(true); }} 
        />
      </td>
      <td className="p-2 border">
        {dirty && <button className="text-blue-600" onClick={save}>保存</button>}
      </td>
    </tr>
  );
}
