import { useEffect, useState } from 'react';
import client from '../api/client';

interface Course {
  id: number;
  name: string;
  timeSlot: string | null;
  location: string | null;
  teacher: string | null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function MySchedule() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    client.get('/api/users/me/courses').then(res => setCourses(res.data));
  }, []);

  // Simple parser: "Mon 09:00-11:00"
  function getCourseForSlot(day: string, time: string) {
    return courses.find(c => {
      if (!c.timeSlot) return false;
      const [d, t] = c.timeSlot.split(' ');
      if (d !== day) return false;
      const [start, end] = t.split('-');
      // Check if time is within start (inclusive)
      // This is a simplified check for grid display
      return time >= start && time < end;
    });
  }

  return (
    <div>
      <h1 className="text-xl mb-4">我的课表</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border w-20">时间</th>
              {DAYS.map(d => <th key={d} className="p-2 border w-40">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(t => (
              <tr key={t}>
                <td className="p-2 border font-bold text-center">{t}</td>
                {DAYS.map(d => {
                  const c = getCourseForSlot(d, t);
                  return (
                    <td key={d} className="p-2 border h-16 align-top bg-white relative">
                      {c && (
                        <div className="absolute inset-1 bg-blue-100 p-1 text-xs rounded overflow-hidden">
                          <div className="font-bold">{c.name}</div>
                          <div>{c.location}</div>
                          <div>{c.teacher}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
