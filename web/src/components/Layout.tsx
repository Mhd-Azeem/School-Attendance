import {NavLink,Outlet,useLocation} from 'react-router-dom'
import {BarChart3,Bell,ClipboardCheck,GraduationCap,History,Home,LogOut,Menu,UserRound,Users} from 'lucide-react'
import {useAuth} from '../AuthContext'

const teacherLinks=[['/','Home',Home],['/attendance','Student',ClipboardCheck],['/period-attendance','Teacher Period',Users],['/history','History',History],['/profile','Profile',UserRound]] as const
const adminLinks=[['/','Home',Home],['/classes','Classes',GraduationCap],['/teachers','Teachers',Users],['/reports','Reports',BarChart3],['/profile','Profile',UserRound]] as const
const titles:Record<string,string>={'/':'Home','/attendance':'Student Attendance','/period-attendance':'Teachers Attendance & Status','/history':'Teacher History','/classes':'Classes','/students':'Classes','/teachers':'Teachers Management','/reports':'Reports','/calendar':'School Calendar','/audit':'Audit Log','/settings':'Settings','/profile':'Profile','/timetable':'Timetable / Period Setup'}

export function Layout(){
 const {profile,signOut}=useAuth(),loc=useLocation()
 const links=profile?.role==='SECTION_HEAD'?adminLinks:teacherLinks
 const title=titles[loc.pathname]||(profile?.role==='SECTION_HEAD'?'Section Head':'Teacher')
 return <div className="shell">
   <aside className="sidebar">
    <div className="brand"><img src="zahira-logo.jpg" alt="Zahira College Matale"/><div><strong>School Attendance</strong><small>{profile?.role==='SECTION_HEAD'?'Section Head Portal':'Teacher Portal'}</small></div></div>
    <nav>{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'}><Icon size={20}/><span>{label}</span></NavLink>)}</nav>
    {profile?.role==='SECTION_HEAD'&&<div className="desktop-extra"><NavLink to="/calendar">Calendar</NavLink><NavLink to="/audit">Audit</NavLink><NavLink to="/settings">Settings</NavLink></div>}
    <button className="logout" onClick={signOut}><LogOut size={19}/>Logout</button>
   </aside>
   <div className="workspace">
    <header className="appbar"><Menu className="mobile-only" size={22}/><strong>{title}</strong><Bell size={20}/></header>
    <main><Outlet/></main>
   </div>
 </div>
}