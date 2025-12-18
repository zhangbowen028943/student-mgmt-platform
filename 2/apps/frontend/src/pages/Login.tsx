import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/auth';
import type { RootState } from '../store';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const loading = useSelector((s: RootState) => s.auth.loading);
  const error = useSelector((s: RootState) => s.auth.error);
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-xl mb-4">登录</h1>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">用户名</label>
          <input className="w-full border px-3 py-2" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">密码</label>
          <input className="w-full border px-3 py-2" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="w-full bg-blue-600 text-white py-2" disabled={loading} onClick={() => dispatch(login({ username, password }) as any)}>
          {loading ? '登录中...' : '登录'}
        </button>
        {error ? <div className="text-red-600 text-sm">{error}</div> : null}
      </div>
    </div>
  );
}

