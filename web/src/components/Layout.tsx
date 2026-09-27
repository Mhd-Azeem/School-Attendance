import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom'
import {BarChart3,Bell,CalendarDays,CheckCircle2,ClipboardCheck,GraduationCap,History,Home,LogOut,Menu,RotateCw,Settings,ShieldCheck,UserRound,Users,X} from 'lucide-react'
import {useAuth} from '../AuthContext'
import {api} from '../lib/api'
import {schoolDate} from '../lib/date'

const teacherLinks=[['/','Home',Home],['/attendance','Student',ClipboardCheck],['/period-attendance','Teacher Period',Users],['/history','History',History],['/profile','Profile',UserRound]] as const
const adminLinks=[['/','Home',Home],['/classes','Classes',GraduationCap],['/teachers','Teachers',Users],['/reports','Reports',BarChart3],['/profile','Profile',UserRound]] as const
const adminMenuExtras=[['/individual-attendance','Individual Attendance',ClipboardCheck],['/students','Manage Students',Users],['/calendar','Calendar',CalendarDays],['/audit','Audit',ShieldCheck],['/settings','Settings',Settings]] as const
const teacherMenuExtras=[['/individual-attendance','Individual Attendance',ClipboardCheck],['/settings','Settings',Settings]] as const
const titles:Record<string,string>={'/':'Home','/attendance':'Student Attendance','/period-attendance':'Teachers Attendance & Status','/history':'Teacher History','/classes':'Classes','/students':'Manage Students','/teachers':'Teachers Management','/reports':'Reports','/calendar':'School Calendar','/audit':'Audit Log','/settings':'Settings','/profile':'Profile','/individual-attendance':'Individual Attendance'}
type Notice={id:string;title:string;text:string;tone:'warn'|'ok'|'info';backendId?:string;read?:boolean}
type SuccessPopup={title:string;message:string}|null

export function Layout(){
 const {profile,signOut}=useAuth(),loc=useLocation(),navigate=useNavigate()
 const [menuOpen,setMenuOpen]=useState(false),[notificationsOpen,setNotificationsOpen]=useState(false),[notices,setNotices]=useState<Notice[]>([]),[noticeLoading,setNoticeLoading]=useState(false),[successPopup,setSuccessPopup]=useState<SuccessPopup>(null)
 const [pullDistance,setPullDistance]=useState(0),[pullRefreshing,setPullRefreshing]=useState(false)
 const pullRef=useRef({tracking:false,startY:0,startX:0})
 const links=profile?.role==='SECTION_HEAD'?adminLinks:teacherLinks
 const isNativeApp=window.location.hostname==='appassets.androidplatform.net'
 const showBranding=!isNativeApp||loc.pathname==='/'
 const navLinks=links as readonly (readonly [string,string,any])[]
 const activeNavIndex=Math.max(0,navLinks.findIndex(item=>{const to=item[0];return to==='/'?loc.pathname==='/':loc.pathname.startsWith(to)}))
 const [navDragIndex,setNavDragIndex]=useState<number|null>(null)
 const navPointer=useRef({active:false,startX:0,pointerId:-1,dragging:false})
 const suppressNavClick=useRef(false)
 const navPosition=navDragIndex??activeNavIndex
 function navPointerPosition(e:any){
  const rect=e.currentTarget.getBoundingClientRect()
  const raw=((e.clientX-rect.left)/rect.width)*navLinks.length-.5
  return Math.max(0,Math.min(navLinks.length-1,raw))
 }
 function beginNavDrag(e:any){
  if(window.innerWidth>700)return
  navPointer.current={active:true,startX:e.clientX,pointerId:e.pointerId,dragging:false}
 }
 function moveNavDrag(e:any){
  const p=navPointer.current
  if(!p.active||p.pointerId!==e.pointerId)return
  if(!p.dragging){
   if(Math.abs(e.clientX-p.startX)<10)return
   p.dragging=true
   e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  setNavDragIndex(navPointerPosition(e))
 }
 function endNavDrag(e:any){
  const p=navPointer.current
  if(!p.active||p.pointerId!==e.pointerId)return
  navPointer.current={active:false,startX:0,pointerId:-1,dragging:false}
  if(!p.dragging)return
  e.preventDefault()
  suppressNavClick.current=true
  const target=Math.max(0,Math.min(navLinks.length-1,Math.round(navPointerPosition(e))))
  setNavDragIndex(null)
  navigate(navLinks[target][0])
 }
 function cancelNavDrag(){navPointer.current={active:false,startX:0,pointerId:-1,dragging:false};setNavDragIndex(null)}
 function blockDraggedClick(e:any){if(!suppressNavClick.current)return;suppressNavClick.current=false;e.preventDefault();e.stopPropagation()}
 const drawerLinks=profile?.role==='SECTION_HEAD'?[...adminLinks,...adminMenuExtras]:[...teacherLinks,...teacherMenuExtras]
 const title=titles[loc.pathname]||(profile?.role==='SECTION_HEAD'?'Section Head':'Teacher')

 useEffect(()=>{setMenuOpen(false);setNotificationsOpen(false)},[loc.pathname])
 useEffect(()=>{
  if(window.innerWidth>700)return
  const ignored=(target:EventTarget|null)=>{
   const el=target as HTMLElement|null
   return !!el?.closest('input,select,textarea,[contenteditable="true"],.primary-nav,.mobile-drawer,.notification-panel')
  }
  const atTop=()=>window.scrollY<=0&&document.documentElement.scrollTop<=0
  const start=(e:TouchEvent)=>{
   if(pullRefreshing||menuOpen||notificationsOpen||!atTop()||ignored(e.target)||e.touches.length!==1)return
   const t=e.touches[0]
   pullRef.current={tracking:true,startY:t.clientY,startX:t.clientX}
  }
  const move=(e:TouchEvent)=>{
   const p=pullRef.current
   if(!p.tracking||e.touches.length!==1)return
   const t=e.touches[0],dy=t.clientY-p.startY,dx=Math.abs(t.clientX-p.startX)
   if(dy<=0||dx>dy){if(dy<0)p.tracking=false;return}
   if(!atTop()){p.tracking=false;setPullDistance(0);return}
   const resisted=Math.min(104,dy*.52)
   if(resisted>4&&e.cancelable)e.preventDefault()
   setPullDistance(resisted)
  }
  const end=()=>{
   const p=pullRef.current
   if(!p.tracking)return
   p.tracking=false
   if(pullDistance>=72){
    setPullRefreshing(true)
    setPullDistance(78)
    window.setTimeout(()=>window.location.reload(),260)
   }else setPullDistance(0)
  }
  const cancel=()=>{pullRef.current.tracking=false;if(!pullRefreshing)setPullDistance(0)}
  window.addEventListener('touchstart',start,{passive:true})
  window.addEventListener('touchmove',move,{passive:false})
  window.addEventListener('touchend',end,{passive:true})
  window.addEventListener('touchcancel',cancel,{passive:true})
  return()=>{
   window.removeEventListener('touchstart',start)
   window.removeEventListener('touchmove',move)
   window.removeEventListener('touchend',end)
   window.removeEventListener('touchcancel',cancel)
  }
 },[menuOpen,notificationsOpen,pullDistance,pullRefreshing])

 useEffect(()=>{
  if(!menuOpen)return
  const previous=document.body.style.overflow
  document.body.style.overflow='hidden'
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenuOpen(false)}
  window.addEventListener('keydown',close)
  return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close)}
 },[menuOpen])
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
    {showBranding&&<div className="brand"><img src="zahira-logo.jpg" alt="Zahira College Matale"/><div><strong>School Attendance App</strong><small>{profile?.role==='SECTION_HEAD'?'Section Head Portal':'Teacher Portal'}</small></div></div>}
    <nav className={`primary-nav ${navDragIndex!==null?'is-dragging':''}`} style={{'--nav-position':navPosition} as CSSProperties} onPointerDown={beginNavDrag} onPointerMove={moveNavDrag} onPointerUp={endNavDrag} onPointerCancel={cancelNavDrag} onClickCapture={blockDraggedClick}>
     <span className="liquid-nav-indicator" aria-hidden="true"/>
     {navLinks.map(item=>{const [to,label,Icon]=item;return <NavLink key={to} to={to} end={to==='/'}><Icon size={20}/><span>{label}</span></NavLink>})}
    </nav>
    {profile?.role==='SECTION_HEAD'&&<div className="desktop-extra"><NavLink to="/calendar">Calendar</NavLink><NavLink to="/audit">Audit</NavLink><NavLink to="/settings">Settings</NavLink></div>}
    <button className="logout" onClick={signOut}><LogOut size={19}/>Logout</button>
   </aside>

   {menuOpen&&<button type="button" className="drawer-backdrop" aria-label="Close menu" onClick={()=>setMenuOpen(false)}/>}
   <aside className={`mobile-drawer ${menuOpen?'open':''}`} aria-hidden={!menuOpen} data-open={menuOpen?'true':'false'}>
    <div className="drawer-head"><div><strong>{profile?.full_name}</strong><small>{profile?.role==='SECTION_HEAD'?'Section Head':'Teacher'}</small></div><button type="button" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X/></button></div>
    <nav>{drawerLinks.map(item=>{const [to,label,Icon]=item;return <NavLink key={to} to={to} end={to==='/'} onClick={()=>setMenuOpen(false)}><Icon/><span>{label}</span></NavLink>})}</nav>
    <button type="button" className="drawer-logout" onClick={signOut}><LogOut/> Logout</button>
   </aside>

   <div className="workspace">
    <div className={`pull-refresh-indicator ${pullDistance>0||pullRefreshing?'visible':''} ${pullDistance>=72?'ready':''} ${pullRefreshing?'refreshing':''}`} style={{transform:`translate(-50%, ${Math.max(-54,Math.min(18,pullDistance*.72-54))}px)`,opacity:pullRefreshing?1:Math.min(1,pullDistance/28)}} aria-hidden="true"><RotateCw/><span>{pullRefreshing?'Refreshing…':pullDistance>=72?'Release to refresh':'Pull to refresh'}</span></div>
    <header className="appbar">
     <button type="button" className="appbar-icon mobile-only" aria-label={menuOpen?'Close menu':'Open menu'} aria-expanded={menuOpen} onClick={e=>{e.preventDefault();e.stopPropagation();setNotificationsOpen(false);setMenuOpen(v=>!v)}}><Menu size={24}/></button>
     <strong className="appbar-page-title">{title}</strong>
     <button className="appbar-icon bell-button" aria-label="Notifications" onClick={toggleNotifications}><Bell size={21}/>{notices.some(n=>n.tone==='warn')&&<span className="notification-badge">{notices.filter(n=>n.tone==='warn').length}</span>}</button>
    </header>
    {showBranding&&<section className="mobile-brand-strip" aria-label="School Attendance App">
     <img src="zahira-logo.jpg" alt="Zahira College Matale"/>
     <strong>School Attendance App</strong>
    </section>}
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