import {useEffect,useMemo,useState,type ReactNode} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {AlertCircle,BookOpenCheck,CheckCircle2,ChevronDown,Clock3,ClipboardCheck,UserRound,Users} from 'lucide-react'
import {useAuth} from '../AuthContext'
import {api} from '../lib/api'
import {schoolDate,prettyDate} from '../lib/date'
import type {SchoolClass} from '../types'
import {clearLegacyProfilePhoto,getProfilePhoto} from '../lib/profilePhoto'

type Summary=SchoolClass&{session_id:string|null;submitted_at:string|null;total:number;marked?:number;present:number;absent:number;late:number}
type TeacherRow={id:string;full_name:string}

function useAccountPhoto(userId?:string){
 const [photo,setPhoto]=useState(()=>getProfilePhoto(userId))
 useEffect(()=>{clearLegacyProfilePhoto();setPhoto(getProfilePhoto(userId));const h=(e:Event)=>{const id=(e as CustomEvent<{userId?:string}>).detail?.userId;if(!id||id===userId)setPhoto(getProfilePhoto(userId))};window.addEventListener('profile-photo-changed',h);return()=>window.removeEventListener('profile-photo-changed',h)},[userId])
 return photo
}

export function Dashboard(){const {profile}=useAuth();return profile?.role==='SECTION_HEAD'?<AdminDashboard/>:<TeacherDashboard/>}

function TeacherDashboard(){
 const {profile}=useAuth(),today=schoolDate()
 const [classes,setClasses]=useState<SchoolClass[]>([])
 const [studentStatus,setStudentStatus]=useState({session:false,complete:false,marked:0,total:0})
 const [periodDone,setPeriodDone]=useState({done:0,total:0})
 const photo=useAccountPhoto(profile?.id)

 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(async x=>{
  setClasses(x.classes);const first=x.classes[0];if(!first)return
  try{
   const a=await api<{session_id:string|null;complete:boolean;marked:number;total:number}>(`/api/attendance/status?class_id=${encodeURIComponent(first.id)}&date=${today}`)
   setStudentStatus({session:!!a.session_id,complete:a.complete,marked:Number(a.marked||0),total:Number(a.total||0)})
  }catch{setStudentStatus({session:false,complete:false,marked:0,total:0})}
  try{const p=await api<{periods:any[]}>(`/api/period-attendance/today?date=${today}`);setPeriodDone({done:p.periods.filter(r=>r.status).length,total:p.periods.length})}catch{}
 }).catch(()=>setClasses([]))},[today])

 const classLabel=classes.map(c=>c.display_name).join(', ')||'No class assigned'
 const studentText=studentStatus.complete?'Submitted':studentStatus.session?`${studentStatus.marked}/${studentStatus.total} marked · Incomplete`:'Not submitted'
 return <>
  <section className="welcome-card">
   <div className="avatar">{photo?<img src={photo} alt="Profile"/>:<UserRound/>}</div>
   <div><p>Welcome, <strong>{profile?.full_name.split(' ')[0]}</strong></p><small>Class Teacher · {classLabel}</small><span className="date-chip">{prettyDate(today)}</span></div>
  </section>
  <div className="teacher-module-grid">
   <Link className="teacher-module student-module" to={classes[0]?'/attendance?class='+classes[0].id:'/attendance'}><span className="module-icon"><ClipboardCheck/></span><div><strong>Student Attendance</strong><small>Mark today's student attendance</small></div><b>›</b></Link>
   <Link className="teacher-module period-module" to="/period-attendance"><span className="module-icon"><BookOpenCheck/></span><div><strong>Teacher Period Attendance</strong><small>Mark your period status · 1–9</small></div><b>›</b></Link>
  </div>
  <section className="mini-section"><h3>Today's Submission Status</h3>
   <div className="submission-cards">
    <div><span className="mini-icon"><ClipboardCheck/></span><p><strong>Student Attendance</strong><small>{studentText}</small></p><em className={studentStatus.complete?'ok':'pending-dot'}>{studentStatus.complete?'✓':'!'}</em></div>
    <div><span className="mini-icon"><BookOpenCheck/></span><p><strong>Teacher Period Attendance</strong><small>{periodDone.total?`${periodDone.done}/${periodDone.total} completed`:'Not configured'}</small></p><em className={periodDone.total&&periodDone.done===periodDone.total?'ok':'pending-dot'}>{periodDone.total&&periodDone.done===periodDone.total?'✓':periodDone.total?periodDone.done:'—'}</em></div>
   </div>
  </section>
 </>}

function AdminDashboard(){
 const today=schoolDate(),{profile}=useAuth(),photo=useAccountPhoto(profile?.id)
 const [rows,setRows]=useState<Summary[]>([]),[teachers,setTeachers]=useState<TeacherRow[]>([]),[error,setError]=useState(''),[expanded,setExpanded]=useState<string|null>(null),[pendingOpen,setPendingOpen]=useState(false),[sending,setSending]=useState<Record<string,string>>({})
 async function load(){try{const [d,t]=await Promise.all([api<{classes:Summary[]}>(`/api/dashboard/today?date=${today}&_=${Date.now()}`),api<{teachers:TeacherRow[]}>('/api/teachers')]);setRows(d.classes.map((c:any)=>({...c,id:String(c.class_id??c.id)})));setTeachers(t.teachers);setError('')}catch{setError('Could not load today’s dashboard.')}}
 useEffect(()=>{load()},[today])
 const markedOf=(x:Summary)=>Number(x.marked??(Number(x.present||0)+Number(x.absent||0)+Number(x.late||0))),submitted=rows.filter(x=>!!x.session_id&&markedOf(x)>=Number(x.total||0)),pending=rows.filter(x=>!x.session_id||markedOf(x)<Number(x.total||0))
 const totals=useMemo(()=>rows.reduce((a,s)=>({present:a.present+Number(s.present||0),absent:a.absent+Number(s.absent||0),total:a.total+Number(s.total||0)}),{present:0,absent:0,total:0}),[rows])
 const pct=totals.total?Math.round(totals.present*100/totals.total):0
 async function sendReminder(c:Summary){setSending(s=>({...s,[c.id]:'Sending…'}));try{const r=await api<{teacher:{full_name:string}}>('/api/notifications/pending-class',{method:'POST',body:JSON.stringify({class_id:c.id,date:today})});setSending(s=>({...s,[c.id]:`Sent to ${r.teacher.full_name} ✓`}))}catch(e){const m=e instanceof Error?e.message:'';setSending(s=>({...s,[c.id]:m==='class_teacher_not_assigned'?'No class teacher assigned':'Could not send reminder'}))}}
 async function notifyAll(){for(const c of pending)await sendReminder(c)}
 return <>
  <section className="welcome-card admin-welcome"><div className="avatar">{photo?<img src={photo} alt="Profile"/>:<UserRound/>}</div><div><p>Welcome, <strong>{profile?.full_name.split(' ')[0]}</strong></p><small>Section Head</small><span className="date-chip">{prettyDate(today)}</span></div></section>
  {error&&<div className="error">{error}</div>}
  <div className="admin-stat-grid">
   <Link to="/student-summary?type=total" className="stat-link"><Stat label="Total Students" value={totals.total} icon={<Users/>}/></Link>
   <Link to="/student-summary?type=present" className="stat-link"><Stat label="Present Today" value={totals.present} icon={<CheckCircle2/>} tone="green"/></Link>
   <Link to="/student-summary?type=absent" className="stat-link"><Stat label="Absent Today" value={totals.absent} icon={<AlertCircle/>} tone="amber"/></Link>
   <Link to="/student-summary?type=submitted" className="stat-link"><Stat label="Submitted" value={`${submitted.length}/${rows.length}`} icon={<ClipboardCheck/>} tone="violet"/></Link>
  </div>
  <section className="overview-card"><h3>Today's Overview</h3><div className="overview-line"><span>Student Attendance</span><strong>{totals.present}/{totals.total} ({pct}%)</strong></div><div className="progress"><span style={{width:pct+'%'}}/></div><div className="overview-statuses"><span className="green">● {totals.present}<small>Present</small></span><span className="red">● {totals.absent}<small>Absent</small></span></div><Link className="primary wide" to="/classes">View Class Status</Link></section>
  {pending.length>0&&<section className="pending pending-expandable"><button className="pending-toggle" onClick={()=>setPendingOpen(v=>!v)}><AlertCircle/><div><strong>Pending Classes <span className="pending-count">{pending.length}</span></strong><p>{pendingOpen?'Tap again to collapse':'Tap to view pending classes'}</p></div><ChevronDown className={pendingOpen?'rotated':''}/></button>{pendingOpen&&<div className="pending-list"><button className="notify-all" onClick={notifyAll}>Notify all pending class teachers</button>{pending.map(c=>{const marked=markedOf(c);return <div className="pending-class-row" key={c.id}><div><strong>{c.display_name}</strong><span>{c.session_id?`${marked}/${c.total} students marked`:'Student attendance not submitted'}</span></div><button className="send-reminder" onClick={()=>sendReminder(c)} disabled={sending[c.id]==='Sending…'}>{sending[c.id]||'Send Reminder'}</button></div>})}</div>}</section>}
  <section className="class-status-card"><div className="section-heading"><h3>Class Submission Status</h3><Link to="/classes">View all</Link></div>{rows.slice(0,10).map(c=>{const marked=Number(c.marked??(Number(c.present||0)+Number(c.absent||0)+Number(c.late||0))),complete=!!c.session_id&&marked>=Number(c.total||0);return <div className="class-status-item" key={c.id}><button className="class-status-row class-status-button" disabled={!c.session_id} onClick={()=>c.session_id&&setExpanded(expanded===c.id?null:c.id)}><strong>{c.display_name}</strong><span className={complete?'status-pill submitted':c.session_id?'status-pill progress':'status-pill waiting'}>{complete?'✓ Submitted':c.session_id?'In Progress':'Not Submitted'}</span><small>{c.session_id?`${c.present} present · ${c.absent} absent · ${marked}/${c.total} marked`:'—'}</small>{c.session_id&&<ChevronDown className={expanded===c.id?'rotated':''}/>}</button>{expanded===c.id&&c.session_id&&<div className="class-attendance-detail"><div className="class-detail-counts"><span className="total-count"><strong>{c.total}</strong><small>Total Students</small></span><span className="present-count"><strong>{Number(c.present||0)}</strong><small>Present</small></span><span className="absent-count"><strong>{Number(c.absent||0)}</strong><small>Absent</small></span><span className="unmarked-count"><strong>{Math.max(0,Number(c.total||0)-marked)}</strong><small>Not Marked</small></span></div></div>}</div>})}</section>
 </>}
function Stat({label,value,icon,tone='blue'}:{label:string,value:string|number,icon:ReactNode,tone?:string}){return <article className={'admin-stat '+tone}><span>{icon}</span><small>{label}</small><strong>{value}</strong></article>}
export function StudentSummary(){
 const [params]=useSearchParams(),type=params.get('type')||'total',today=schoolDate()
 const [students,setStudents]=useState<any[]>([]),[dashboard,setDashboard]=useState<Summary[]>([]),[details,setDetails]=useState<any[]>([]),[error,setError]=useState('')
 useEffect(()=>{Promise.all([api<{students:any[]}>('/api/students'),api<{classes:Summary[]}>(`/api/dashboard/today?date=${today}&_=${Date.now()}`)]).then(async([s,d])=>{const ds=d.classes.map((c:any)=>({...c,id:String(c.class_id??c.id)}));setStudents(s.students);setDashboard(ds);if(type==='present'||type==='absent'){const out:any[]=[];for(const c of ds.filter(x=>x.session_id)){try{const x:any=await api(`/api/attendance/${c.session_id}`);for(const r of x.records||[])if(String(r.status).toLowerCase()===type)out.push({...r,class_name:c.display_name})}catch{}}setDetails(out)}}).catch(()=>setError('Could not load student list.'))},[type,today])
 const title=type==='present'?'Present Students Today':type==='absent'?'Absent Students Today':type==='submitted'?'Submitted Classes Today':'Total Students'
 const totalList=students.filter(s=>s.is_active!==0), submittedRows=dashboard.filter(c=>!!c.session_id&&Number(c.marked??(Number(c.present||0)+Number(c.absent||0)+Number(c.late||0)))>=Number(c.total||0))
 return <><div className="screen-title-row"><div><h1>{title}</h1><p>{prettyDate(today)}</p></div></div>{error&&<div className="error">{error}</div>}
 {type==='total'&&<section className="data-list">{totalList.map(s=><article key={s.id}><div><strong>{s.full_name}</strong><small>{s.admission_number} · {s.display_name}</small></div></article>)}</section>}
 {(type==='present'||type==='absent')&&<section className="data-list">{details.map((s,i)=><article key={(s.student_id||s.id||i)+'-'+i}><div><strong>{s.full_name||s.student_name}</strong><small>{s.admission_number} · {s.class_name}</small></div></article>)}</section>}
 {type==='submitted'&&<section className="data-list">{submittedRows.map(c=><article key={c.id}><div><strong>{c.display_name}</strong><small>{Number(c.marked??0)}/{c.total} students marked</small></div><span className="status-pill submitted">✓ Submitted</span></article>)}</section>}
 {!error&&((type==='total'&&!totalList.length)||((type==='present'||type==='absent')&&!details.length)||(type==='submitted'&&!submittedRows.length))&&<div className="empty-card">No records for today.</div>}</>
}
