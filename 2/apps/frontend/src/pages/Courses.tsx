import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAppSelector } from '../store';

interface Course {
  id: number;
  name: string;
  credits: number;
  teacher: string | null;
  timeSlot: string | null;
  location: string | null;
  capacity: number;
  waitlist: number;
  enrollmentStatus?: string; // 'enrolled' | 'waitlisted' | 'dropped' | undefined
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourseIds, setMyCourseIds] = useState<Set<number>>(new Set());
  const { user } = useAppSelector(state => state.auth);

  async function load() {
    const [allRes, myRes] = await Promise.all([
      client.get('/api/courses'),
      client.get('/api/users/me/courses')
    ]);
    
    setCourses(allRes.data);
    setMyCourseIds(new Set(myRes.data.map((c: any) => c.id)));
  }

  useEffect(() => {
    load();
  }, []);

  async function enroll(id: number) {
    try {
      await client.post(`/api/courses/${id}/enroll`);
      alert('选课成功');
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || '选课失败');
    }
  }

  return (
    <div>
      <h1 className="text-xl mb-4">课程选修</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">课程名</th>
              <th className="p-2 border">学分</th>
              <th className="p-2 border">教师</th>
              <th className="p-2 border">时间地点</th>
              <th className="p-2 border">容量</th>
              <th className="p-2 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => {
              const isEnrolled = myCourseIds.has(c.id);
              return (
                <tr key={c.id}>
                  <td className="p-2 border">{c.name}</td>
                  <td className="p-2 border">{c.credits}</td>
                  <td className="p-2 border">{c.teacher}</td>
                  <td className="p-2 border">{c.timeSlot} {c.location}</td>
                  <td className="p-2 border">{c.capacity}</td>
                  <td className="p-2 border">
                    {isEnrolled ? (
                      <span className="text-green-600">已选</span>
                    ) : (
                      <button 
                        className="px-3 py-1 bg-blue-600 text-white disabled:opacity-50"
                        onClick={() => enroll(c.id)}
                        disabled={user?.role !== 'student'}
                      >
                        选课
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
