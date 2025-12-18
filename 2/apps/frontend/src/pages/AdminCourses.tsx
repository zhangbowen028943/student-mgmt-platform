import { useEffect, useState } from 'react';
import client from '../api/client';

interface Course {
  id: number;
  name: string;
  credits: number;
  teacher: string | null;
  timeSlot: string | null;
  location: string | null;
  capacity: number;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Partial<Course> | null>(null);

  async function load() {
    const res = await client.get('/api/courses');
    setCourses(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    try {
      if (editing.id) {
        await client.put(`/api/courses/${editing.id}`, editing);
      } else {
        await client.post('/api/courses', editing);
      }
      setEditing(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  }

  async function remove(id: number) {
    if (!confirm('确认删除？')) return;
    await client.delete(`/api/courses/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="text-xl mb-4">课程管理</h1>
      <button 
        className="mb-4 px-3 py-1 bg-green-600 text-white"
        onClick={() => setEditing({})}
      >
        新增课程
      </button>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96 space-y-3">
            <h2 className="text-lg font-bold">{editing.id ? '编辑课程' : '新增课程'}</h2>
            <input 
              className="w-full border px-3 py-2" 
              placeholder="课程名" 
              value={editing.name || ''} 
              onChange={e => setEditing({ ...editing, name: e.target.value })} 
            />
            <input 
              className="w-full border px-3 py-2" 
              type="number"
              placeholder="学分" 
              value={editing.credits || ''} 
              onChange={e => setEditing({ ...editing, credits: Number(e.target.value) })} 
            />
            <input 
              className="w-full border px-3 py-2" 
              placeholder="教师" 
              value={editing.teacher || ''} 
              onChange={e => setEditing({ ...editing, teacher: e.target.value })} 
            />
            <input 
              className="w-full border px-3 py-2" 
              placeholder="时间段 (Mon 09:00-11:00)" 
              value={editing.timeSlot || ''} 
              onChange={e => setEditing({ ...editing, timeSlot: e.target.value })} 
            />
            <input 
              className="w-full border px-3 py-2" 
              placeholder="地点" 
              value={editing.location || ''} 
              onChange={e => setEditing({ ...editing, location: e.target.value })} 
            />
            <input 
              className="w-full border px-3 py-2" 
              type="number"
              placeholder="容量" 
              value={editing.capacity || ''} 
              onChange={e => setEditing({ ...editing, capacity: Number(e.target.value) })} 
            />
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 border" onClick={() => setEditing(null)}>取消</button>
              <button className="px-3 py-1 bg-blue-600 text-white" onClick={save}>保存</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">课程名</th>
              <th className="p-2 border">学分</th>
              <th className="p-2 border">教师</th>
              <th className="p-2 border">时间地点</th>
              <th className="p-2 border">容量</th>
              <th className="p-2 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td className="p-2 border">{c.id}</td>
                <td className="p-2 border">{c.name}</td>
                <td className="p-2 border">{c.credits}</td>
                <td className="p-2 border">{c.teacher}</td>
                <td className="p-2 border">{c.timeSlot} {c.location}</td>
                <td className="p-2 border">{c.capacity}</td>
                <td className="p-2 border space-x-2">
                  <button className="text-blue-600" onClick={() => setEditing(c)}>编辑</button>
                  <button className="text-red-600" onClick={() => remove(c.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
