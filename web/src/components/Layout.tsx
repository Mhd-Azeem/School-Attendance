import { NavLink,Outlet } from 'react-router-dom'
import { BarChart3,CalendarDays,ClipboardCheck,GraduationCap,History,LayoutDashboard,LogOut,Settings,Users } from 'lucide-react'
import { useAuth } from '../AuthContext'

const teacherLinks=[['/','Home',LayoutDashboard],['/attendance','Attendance',ClipboardCheck],['/history','History',History]] as const
const adminLinks=[['/','Dashboard',LayoutDashboard],['/attendance','Attendance',ClipboardCheck],['/students','Students',GraduationCap],['/teachers','Teachers',Users],['/reports','Reports',BarChart3],['/calendar','Calendar',CalendarDays],['/audit','Audit',History],['/settings','Settings',Settings]] as const
export function Layout(){const {profile,signOut}=useAuth();const links=profile?.role==='SECTION_HEAD'?adminLinks:teacherLinks
 return <div className="shell"><aside className="sidebar"><div className="brand"><span>SA</span><div>School<br/><small>Attendance</small></div></div><nav>{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'}><Icon size={20}/><span>{label}</span></NavLink>)}</nav><button className="logout" onClick={signOut}><LogOut size={20}/>Logout</button></aside>
 <div className="workspace"><header><div><small>{profile?.role==='SECTION_HEAD'?'SECTION HEAD':'TEACHER PORTAL'}</small><strong>{profile?.full_name}</strong></div><span className="online" title="Network status">● <span>{navigator.onLine?'Online':'Offline'}</span></span></header><main><Outlet/></main></div></div>}

