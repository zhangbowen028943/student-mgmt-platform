import { useEffect, useState } from 'react';
import client from '../api/client';

interface Student {
  id: number;
  studentNumber: string;
  name: string;
  major: string | null;
  grade: string | null;
  updatedAt: string;
}

export default function AdminStudents() {
  const [items, setItems] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  async function load() {
    const res = await client.get(`/api/admin/students?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`);
    setItems(res.data.items);
    setTotal(res.data.total);
  }

  useEffect(() => {
    load();
  }, [page, pageSize]);

  return (
    <div>
      <h1 className="text-xl mb-4">学生管理</h1>
      <div className="flex gap-2 mb-3">
        <input className="border px-2 py-1" placeholder="搜索关键字" value={q} onChange={e => setQ(e.target.value)} />
        <button className="px-3 py-1 bg-blue-600 text-white" onClick={load}>搜索</button>
        <a className="px-3 py-1 bg-green-600 text-white" href="/api/admin/students/export">导出Excel</a>
        <input type="file" accept=".xlsx,.xls" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
        <button className="px-3 py-1 bg-gray-800 text-white" onClick={async () => {
          if (!uploadFile) return;
          const fd = new FormData();
          fd.append('file', uploadFile);
          await client.post('/api/admin/students/import', fd);
          await load();
        }}>导入Excel</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">学号</th>
              <th className="p-2 border">姓名</th>
              <th className="p-2 border">专业</th>
              <th className="p-2 border">年级</th>
              <th className="p-2 border">更新时间</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td className="p-2 border">{it.studentNumber}</td>
                <td className="p-2 border">{it.name}</td>
                <td className="p-2 border">{it.major}</td>
                <td className="p-2 border">{it.grade}</td>
                <td className="p-2 border">{new Date(it.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span>总数 {total}</span>
        <button className="px-2 py-1 border" onClick={() => setPage(Math.max(1, page - 1))}>上一页</button>
        <button className="px-2 py-1 border" onClick={() => setPage(page + 1)}>下一页</button>
        <select className="border px-2 py-1" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
}
