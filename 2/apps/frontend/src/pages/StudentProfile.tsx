import { useEffect, useState } from 'react';
import client from '../api/client';

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    client.get('/api/users/me').then(res => {
      setProfile(res.data);
      setEmail(res.data.email || '');
      setPhone(res.data.phone || '');
      setAddress(res.data.address || '');
    });
    client.get('/api/users/me/history').then(res => setHistory(res.data));
  }, []);

  async function save() {
    await client.put('/api/users/me', { email, phone, address });
    const res = await client.get('/api/users/me');
    setProfile(res.data);
    // Reload history
    client.get('/api/users/me/history').then(res => setHistory(res.data));
  }

  async function downloadTranscript() {
    try {
      const res = await client.get('/api/grades/transcript', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcript_${profile.username}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch {
      alert('下载失败');
    }
  }

  if (!profile) return <div>加载中...</div>;
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl">我的资料</h1>
        {profile.role === 'student' && (
          <button className="px-3 py-1 bg-green-600 text-white text-sm" onClick={downloadTranscript}>下载成绩单</button>
        )}
      </div>
      <div className="space-y-3 mb-8">
        <div>
          <div className="text-sm text-gray-500">用户名</div>
          <div>{profile.username}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">邮箱</div>
          <input className="w-full border px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-gray-500">电话</div>
          <input className="w-full border px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-gray-500">地址</div>
          <input className="w-full border px-3 py-2" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <button className="px-3 py-2 bg-blue-600 text-white" onClick={save}>保存</button>
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="text-lg mb-2">修改历史</h2>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="text-sm border-l-2 border-gray-300 pl-2">
                <div className="text-gray-500">{new Date(h.changedAt).toLocaleString()} - {h.changedBy}</div>
                <div>修改了 {h.field}: {h.oldValue} -&gt; {h.newValue}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

