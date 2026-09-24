import { Navigate,Route,Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Layout } from './components/Layout'
import { Attendance } from './pages/Attendance'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Placeholder,Students,Teachers } from './pages/Management'
function Protected(){const {session,loading}=useAuth();if(loading)return <div className="loading">Loading secure portal…</div>;return session?<Layout/>:<Navigate to="/login" replace/>}
export default function App(){const {profile}=useAuth(),admin=profile?.role==='SECTION_HEAD';return <Routes><Route path="/login" element={<Login/>}/><Route element={<Protected/>}><Route index element={<Dashboard/>}/><Route path="attendance" element={<Attendance/>}/><Route path="history" element={<Placeholder title="Attendance History" description="Review submitted registers and individual attendance records."/>}/><Route path="students" element={admin?<Students/>:<Navigate to="/"/>}/><Route path="teachers" element={admin?<Teachers/>:<Navigate to="/"/>}/><Route path="reports" element={admin?<Placeholder title="Reports" description="Filter and export attendance by date, class, grade or student."/>:<Navigate to="/"/>}/><Route path="calendar" element={admin?<Placeholder title="School Calendar" description="Manage school days, holidays and special school days."/>:<Navigate to="/"/>}/><Route path="audit" element={admin?<Placeholder title="Audit Log" description="Review attendance changes and administrative actions."/>:<Navigate to="/"/>}/><Route path="settings" element={admin?<Placeholder title="Settings" description="Configure the school timezone, correction rules and low-attendance threshold."/>:<Navigate to="/"/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}

