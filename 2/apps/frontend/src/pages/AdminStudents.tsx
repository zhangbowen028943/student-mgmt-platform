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

interface CapabilityItem {
  key: string;
  label: string;
  category: string;
  enabled: boolean;
  progress: number;
  notes: string;
}

export default function AdminStudents() {
  const [items, setItems] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([]);
  const [savingCaps, setSavingCaps] = useState(false);

  async function load() {
    const res = await client.get(`/api/admin/students?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`);
    setItems(res.data.items);
    setTotal(res.data.total);
  }

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const enabledCount = capabilities.filter(item => item.enabled).length;

  async function openCapabilities(student: Student) {
    const res = await client.get(`/api/admin/students/${student.id}/capabilities`);
    setActiveStudent(student);
    setCapabilities(res.data.items);
  }

  async function saveCapabilities() {
    if (!activeStudent) return;
    setSavingCaps(true);
    try {
      await client.put(`/api/admin/students/${activeStudent.id}/capabilities`, {
        items: capabilities.map(item => ({
          featureKey: item.key,
          enabled: item.enabled,
          progress: item.progress,
          notes: item.notes
        }))
      });
      await load();
    } finally {
      setSavingCaps(false);
    }
  }

  function updateCapability(index: number, patch: Partial<CapabilityItem>) {
    setCapabilities(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

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
              <th className="p-2 border">能力配置</th>
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
                <td className="p-2 border">
                  <button className="px-2 py-1 bg-indigo-600 text-white" onClick={() => openCapabilities(it)}>配置30项功能</button>
                </td>
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

      {activeStudent ? (
        <div className="mt-6 border rounded bg-white p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">{activeStudent.name} - 30项能力功能配置</h2>
            <button className="px-2 py-1 border" onClick={() => setActiveStudent(null)}>关闭</button>
          </div>
          <div className="mb-3 text-sm text-gray-700">
            已启用 {enabledCount} / {capabilities.length}，覆盖率 {capabilities.length ? Math.round((enabledCount / capabilities.length) * 100) : 0}%
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-auto">
            {capabilities.map((item, index) => (
              <div key={item.key} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{item.label}</span>
                  <label className="text-sm flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={e => updateCapability(index, { enabled: e.target.checked })}
                    />
                    启用
                  </label>
                </div>
                <div className="text-xs text-gray-500 mb-2">分类：{item.category}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">进度</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={item.progress}
                    onChange={e => updateCapability(index, { progress: Number(e.target.value) })}
                  />
                  <span className="text-sm w-10 text-right">{item.progress}%</span>
                </div>
                <textarea
                  className="w-full border rounded px-2 py-1 text-sm"
                  rows={2}
                  value={item.notes}
                  placeholder="填写说明..."
                  onChange={e => updateCapability(index, { notes: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <button className="px-3 py-1 bg-blue-600 text-white" disabled={savingCaps} onClick={saveCapabilities}>
              {savingCaps ? '保存中...' : '保存30项功能配置'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
