import {Navigate,Route,Routes} from 'react-router-dom'
import {useAuth} from './AuthContext'
import {Layout} from './components/Layout'
import {Attendance} from './pages/Attendance'
import {Dashboard,StudentSummary} from './pages/Dashboard'
import {Login} from './pages/Login'
import {Students,Teachers} from './pages/Management'
import {Audit,Calendar,History,Reports,Settings,IndividualAttendance,StudentDeletion} from './pages/Operations'
import {TeacherIndividualAttendance} from './pages/TeacherIndividualAttendance'
import {Profile} from './pages/Profile'
import {PeriodAttendance} from './pages/PeriodAttendance'
import {ClassStatus} from './pages/ClassStatus'
function Protected(){const {session,loading}=useAuth();if(loading)return <div className="loading">Loading secure portal…</div>;return session?<Layout/>:<Navigate to="/login" replace/>}
export default function App(){const {profile}=useAuth(),admin=profile?.role==='SECTION_HEAD';return <Routes><Route path="/login" element={<Login/>}/><Route element={<Protected/>}><Route index element={<Dashboard/>}/><Route path="attendance" element={<Attendance/>}/><Route path="period-attendance" element={<PeriodAttendance/>}/><Route path="history" element={<History/>}/><Route path="classes" element={admin?<ClassStatus/>:<Navigate to="/"/>}/><Route path="student-summary" element={admin?<StudentSummary/>:<Navigate to="/"/>}/><Route path="students" element={admin?<Students/>:<Navigate to="/"/>}/><Route path="teachers" element={admin?<Teachers/>:<Navigate to="/"/>}/><Route path="reports" element={admin?<Reports/>:<Navigate to="/"/>}/><Route path="calendar" element={admin?<Calendar/>:<Navigate to="/"/>}/><Route path="audit" element={admin?<Audit/>:<Navigate to="/"/>}/><Route path="individual-attendance" element={admin?<IndividualAttendance/>:<TeacherIndividualAttendance/>}/><Route path="settings" element={<Settings/>}/><Route path="student-deletion" element={<StudentDeletion/>}/><Route path="profile" element={<Profile/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
