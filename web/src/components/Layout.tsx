import {useEffect,useState} from 'react'
import {NavLink,Outlet,useLocation} from 'react-router-dom'
import {BarChart3,Bell,CalendarClock,CalendarDays,CheckCircle2,ClipboardCheck,GraduationCap,History,Home,LogOut,Menu,Settings,ShieldCheck,UserRound,Users,X} from 'lucide-react'
import {useAuth} from '../AuthContext'
import {api} from '../lib/api'
import {schoolDate} from '../lib/date'

const teacherLinks=[['/','Home',Home],['/attendance','Student',ClipboardCheck],['/period-attendance','Teacher Period',Users],['/history','History',History],['/profile','Profile',UserRound]] as const
const adminLinks=[['/','Home',Home],['/classes','Classes',GraduationCap],['/teachers','Teachers',Users],['/reports','Reports',BarChart3],['/profile','Profile',UserRound]] as const
const adminMenuExtras=[['/individual-attendance','Individual Attendance',ClipboardCheck],['/students','Manage Students',Users],['/timetable','Timetable',CalendarClock],['/calendar','Calendar',CalendarDays],['/audit','Audit',ShieldCheck],['/settings','Settings',Settings]] as const
const teacherMenuExtras=[['/individual-attendance','Individual Attendance',ClipboardCheck],['/settings','Settings',Settings]] as const
const titles:Record<string,string>={'/':'Home','/attendance':'Student Attendance','/period-attendance':'Teachers Attendance & Status','/history':'Teacher History','/classes':'Classes','/students':'Manage Students','/teachers':'Teachers Management','/reports':'Reports','/calendar':'School Calendar','/audit':'Audit Log','/settings':'Settings','/profile':'Profile','/timetable':'Timetable / Period Setup','/individual-attendance':'Individual Attendance'}
type Notice={id:string;title:string;text:string;tone:'warn'|'ok'|'info';backendId?:string;read?:boolean}
type SuccessPopup={title:string;message:string}|null

export function Layout(){
 const {profile,signOut}=useAuth(),loc=useLocation()
 const [menuOpen,setMenuOpen]=useState(false),[notificationsOpen,setNotificationsOpen]=useState(false),[notices,setNotices]=useState<Notice[]>([]),[noticeLoading,setNoticeLoading]=useState(false),[successPopup,setSuccessPopup]=useState<SuccessPopup>(null)
 const links=profile?.role==='SECTION_HEAD'?adminLinks:teacherLinks
 const drawerLinks=profile?.role==='SECTION_HEAD'?[...adminLinks,...adminMenuExtras]:[...teacherLinks,...teacherMenuExtras]
 const title=titles[loc.pathname]||(profile?.role==='SECTION_HEAD'?'Section Head':'Teacher')

 useEffect(()=>{setMenuOpen(false);setNotificationsOpen(false)},[loc.pathname])
 useEffect(()=>{loadNotifications()},[profile?.role])
 useEffect(()=>{const show=(e:Event)=>{const d=(e as CustomEvent<{title?:string;message?:string}>).detail||{};setSuccessPopup({title:d.title||'Submitted Successfully',message:d.message||'Your changes have been saved.'})};window.addEventListener('app-success',show);return()=>window.removeEventListener('app-success',show)},[])

 async function loadNotifications(){
  if(!profile)return
  setNoticeLoading(true)
  try{
   const today=schoolDate()
   const next:Notice[]=[]
   try{const server=await api<{notifications:any[]}>('/api/notifications');for(const n of server.notifications){next.push({id:'server-'+n.id,backendId:n.id,read:!!n.is_read,title:n.title,text:n.message,tone:n.is_read?'info':'warn'})}}catch{}
   if(profile.role==='SECTION_HEAD'){
    const d=await api<{classes:any[]}>(`/api/dashboard/today?date=${today}`)
    for(const c of d.classes){
     const marked=Number(c.marked??(Number(c.present||0)+Number(c.absent||0)+Number(c.late||0))),total=Number(c.total||0)
     if(!c.session_id)next.push({id:'student-'+c.class_id,title:`${c.display_name}: attendance pending`,text:'Student attendance has not been submitted today.',tone:'warn'})
     else if(marked<total)next.push({id:'student-'+c.class_id,title:`${c.display_name}: attendance incomplete`,text:`${marked}/${total} students have been marked.`,tone:'warn'})
    }
    if(!next.length)next.push({id:'all-complete',title:'Student attendance complete',text:'All classes have completed today’s student attendance.',tone:'ok'})
   }else{
    const c=await api<{classes:any[]}>('/api/classes')
    const first=c.classes[0]
    if(first){
     const a=await api<{session_id:string|null;complete:boolean;marked:number;total:number}>(`/api/attendance/status?class_id=${encodeURIComponent(first.id)}&date=${today}`)
     if(!a.session_id)next.push({id:'student-pending',title:'Student attendance pending',text:`${first.display_name} has not submitted student attendance today.`,tone:'warn'})
     else if(!a.complete)next.push({id:'student-incomplete',title:'Student attendance incomplete',text:`${a.marked}/${a.total} students are marked for ${first.display_name}.`,tone:'warn'})
     else next.push({id:'student-done',title:'Student attendance submitted',text:`${first.display_name} attendance is complete for today.`,tone:'ok'})
     try{
      const p=await api<{periods:any[]}>(`/api/period-attendance/today?date=${today}`)
      const done=p.periods.filter(x=>x.status).length
      if(!p.periods.length)next.push({id:'period-config',title:'Teacher periods not configured',text:'Ask the Section Head to configure the timetable.',tone:'info'})
      else if(done<p.periods.length)next.push({id:'period-pending',title:'Teacher period attendance pending',text:`${done}/${p.periods.length} periods completed.`,tone:'warn'})
      else next.push({id:'period-done',title:'Teacher period attendance complete',text:'All periods are marked for today.',tone:'ok'})
     }catch{}
    }
   }
   setNotices(next)
  }catch{setNotices([{id:'load-error',title:'Notifications unavailable',text:'Pull down or tap the bell again to retry.',tone:'info'}])}
  finally{setNoticeLoading(false)}
 }
 async function toggleNotifications(){const open=!notificationsOpen;setNotificationsOpen(open);setMenuOpen(false);if(open)await loadNotifications()}
 async function markNotice(n:Notice){if(!n.backendId||n.read)return;try{await api(`/api/notifications/${encodeURIComponent(n.backendId)}/read`,{method:'POST'});setNotices(xs=>xs.map(x=>x.id===n.id?{...x,read:true,tone:'info'}:x))}catch{}}

 return <div className="shell">
   <aside className="sidebar">
    <div className="brand"><img src="zahira-logo.jpg" alt="Zahira College Matale"/><div><strong>School Attendance</strong><small>{profile?.role==='SECTION_HEAD'?'Section Head Portal':'Teacher Portal'}</small></div></div>
    <nav>{links.map(item=>{const [to,label,Icon]=item;return <NavLink key={to} to={to} end={to==='/'}><Icon size={20}/><span>{label}</span></NavLink>})}</nav>
    {profile?.role==='SECTION_HEAD'&&<div className="desktop-extra"><NavLink to="/calendar">Calendar</NavLink><NavLink to="/audit">Audit</NavLink><NavLink to="/settings">Settings</NavLink></div>}
    <button className="logout" onClick={signOut}><LogOut size={19}/>Logout</button>
   </aside>

   {menuOpen&&<button className="drawer-backdrop" aria-label="Close menu" onClick={()=>setMenuOpen(false)}/>}
   <aside className={`mobile-drawer ${menuOpen?'open':''}`} aria-hidden={!menuOpen}>
    <div className="drawer-head"><div><strong>{profile?.full_name}</strong><small>{profile?.role==='SECTION_HEAD'?'Section Head':'Teacher'}</small></div><button onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X/></button></div>
    <nav>{drawerLinks.map(item=>{const [to,label,Icon]=item;return <NavLink key={to} to={to} end={to==='/'}><Icon/><span>{label}</span></NavLink>})}</nav>
    <button className="drawer-logout" onClick={signOut}><LogOut/> Logout</button>
   </aside>

   <div className="workspace">
    <header className="appbar">
     <button className="appbar-icon mobile-only" aria-label="Open menu" onClick={()=>{setMenuOpen(true);setNotificationsOpen(false)}}><Menu size={24}/></button>
     <div className="appbar-mobile-brand" aria-label="School Attendance App">
      <img src="zahira-logo.jpg" alt="Zahira College Matale"/>
      <div><strong>School Attendance App</strong><small>{title}</small></div>
     </div>
     <strong className="appbar-page-title">{title}</strong>
     <button className="appbar-icon bell-button" aria-label="Notifications" onClick={toggleNotifications}><Bell size={21}/>{notices.some(n=>n.tone==='warn')&&<span className="notification-badge">{notices.filter(n=>n.tone==='warn').length}</span>}</button>
    </header>
    {notificationsOpen&&<section className="notification-panel">
      <div className="notification-head"><div><strong>Notifications</strong><small>Today</small></div><button onClick={()=>setNotificationsOpen(false)} aria-label="Close notifications"><X/></button></div>
      {noticeLoading?<div className="notification-loading">Checking today’s status…</div>:<div className="notification-list">{notices.map(n=><button className={`notification-item ${n.tone} ${n.read?'read':''}`} key={n.id} onClick={()=>markNotice(n)}><span/><div><strong>{n.title}</strong><small>{n.text}</small></div></button>)}</div>}
      <button className="notification-refresh" onClick={loadNotifications}>Refresh</button>
    </section>}
    <main><Outlet/></main>
   </div>
   {successPopup&&<div className="success-modal-backdrop" role="presentation"><section className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title"><CheckCircle2 className="success-modal-icon" size={52}/><h2 id="success-title">{successPopup.title}</h2><p>{successPopup.message}</p><button autoFocus onClick={()=>setSuccessPopup(null)}>OK</button></section></div>}
 </div>
}