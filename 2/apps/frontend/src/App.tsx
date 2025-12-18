import { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './store';
import { fetchMe, logout } from './store/slices/auth';
import Login from './pages/Login';
import AdminStudents from './pages/AdminStudents';
import StudentProfile from './pages/StudentProfile';
import Analytics from './pages/Analytics';
import Courses from './pages/Courses';
import AdminCourses from './pages/AdminCourses';
import TeacherGrades from './pages/TeacherGrades';
import MySchedule from './pages/MySchedule';

function Protected({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const auth = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.token) navigate('/login');
  }, [auth.token]);
  if (!auth.token) return <Navigate to="/login" replace />;
  if (roles && auth.user && !roles.includes(auth.user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const auth = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    if (auth.token) dispatch(fetchMe() as any);
  }, [auth.token]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between">
          <nav className="space-x-4">
            <Link to="/">首页</Link>
            {auth.user?.role === 'super_admin' || auth.user?.role === 'department_admin' ? (
              <>
                <Link to="/admin/students">学生管理</Link>
                <Link to="/admin/courses">课程管理</Link>
              </>
            ) : null}
            {auth.user?.role === 'teacher' ? (
              <Link to="/teacher/grades">成绩录入</Link>
            ) : null}
            <Link to="/courses">课程选修</Link>
            {auth.user?.role === 'student' ? (
              <Link to="/schedule">我的课表</Link>
            ) : null}
            <Link to="/profile">我的资料</Link>
            <Link to="/analytics">数据分析</Link>
          </nav>
          <div className="space-x-3">
            {auth.user ? <span>{auth.user.username}（{auth.user.role}）</span> : null}
            {auth.user ? <button className="px-2 py-1 bg-gray-200" onClick={() => dispatch(logout())}>退出</button> : null}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/students" element={<Protected roles={['super_admin','department_admin']}><AdminStudents /></Protected>} />
          <Route path="/admin/courses" element={<Protected roles={['super_admin','department_admin']}><AdminCourses /></Protected>} />
          <Route path="/teacher/grades" element={<Protected roles={['teacher', 'super_admin']}><TeacherGrades /></Protected>} />
          <Route path="/courses" element={<Protected><Courses /></Protected>} />
          <Route path="/schedule" element={<Protected roles={['student']}><MySchedule /></Protected>} />
          <Route path="/profile" element={<Protected><StudentProfile /></Protected>} />
          <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
          <Route path="/" element={<div>欢迎使用学生管理平台</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

