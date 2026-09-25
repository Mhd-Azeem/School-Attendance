import {useEffect,useMemo,useState,type ReactNode} from 'react'
import {Link} from 'react-router-dom'
import {AlertCircle,BookOpenCheck,CheckCircle2,Clock3,ClipboardCheck,UserRound,Users} from 'lucide-react'
import {useAuth} from '../AuthContext'
import {api} from '../lib/api'
import {schoolDate,prettyDate} from '../lib/date'
import type {SchoolClass} from '../types'

type Summary=SchoolClass&{session_id:string|null;submitted_at:string|null;total:number;present:number;absent:number;late:number}
type TeacherRow={id:string;full_name:string}

export function Dashboard(){const {profile}=useAuth();return profile?.role==='SECTION_HEAD'?<AdminDashboard/>:<TeacherDashboard/>}

function TeacherDashboard(){
 const {profile}=useAuth(),today=schoolDate()
 const [classes,setClasses]=useState<SchoolClass[]>([])
 const [studentDone,setStudentDone]=useState(false)
 const [periodDone,setPeriodDone]=useState({done:0,total:0})
 const photo=localStorage.getItem('school_attendance_profile_photo')||''
 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(async x=>{setClasses(x.classes);const first=x.classes[0];if(!first)return;try{const h=await api<{sessions:any[]}>(`/api/history?class_id=${first.id}&from=${today}&to=${today}`);setStudentDone(h.sessions.length>0)}catch{}try{const p=await api<{periods:any[]}>(`/api/period-attendance/today?date=${today}`);setPeriodDone({done:p.periods.filter(r=>r.status).length,total:p.periods.length})}catch{}}).catch(()=>setClasses([]))},[today])
 const classLabel=classes.map(c=>c.display_name).join(', ')||'No class assigned'
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
    <div><span className="mini-icon"><ClipboardCheck/></span><p><strong>Student Attendance</strong><small>{studentDone?'Submitted':'Not submitted'}</small></p><em className={studentDone?'ok':'pending-dot'}>{studentDone?'✓':'!'}</em></div>
    <div><span className="mini-icon"><BookOpenCheck/></span><p><strong>Teacher Period Attendance</strong><small>{periodDone.total?`${periodDone.done}/${periodDone.total} completed`:'Not configured'}</small></p><em className={periodDone.total&&periodDone.done===periodDone.total?'ok':'pending-dot'}>{periodDone.total&&periodDone.done===periodDone.total?'✓':periodDone.total?periodDone.done:'—'}</em></div>
   </div>
  </section>
 </>}

function AdminDashboard(){
 const today=schoolDate(),{profile}=useAuth()
 const [rows,setRows]=useState<Summary[]>([]),[teachers,setTeachers]=useState<TeacherRow[]>([]),[error,setError]=useState('')
 async function load(){try{const [d,t]=await Promise.all([api<{classes:Summary[]}>(`/api/dashboard/today?date=${today}`),api<{teachers:TeacherRow[]}>('/api/teachers')]);setRows(d.classes);setTeachers(t.teachers);setError('')}catch{setError('Could not load today’s dashboard.')}}
 useEffect(()=>{load()},[today])
 const submitted=rows.filter(x=>x.session_id),pending=rows.filter(x=>!x.session_id)
 const totals=useMemo(()=>rows.reduce((a,s)=>({present:a.present+Number(s.present||0),absent:a.absent+Number(s.absent||0),total:a.total+Number(s.total||0)}),{present:0,absent:0,total:0}),[rows])
 const pct=totals.total?Math.round(totals.present*100/totals.total):0
 return <>
  <section className="welcome-card admin-welcome"><div className="avatar"><UserRound/></div><div><p>Welcome, <strong>{profile?.full_name.split(' ')[0]}</strong></p><small>Section Head</small><span className="date-chip">{prettyDate(today)}</span></div></section>
  {error&&<div className="error">{error}</div>}
  <div className="admin-stat-grid">
   <Stat label="Total Classes" value={rows.length} icon={<Users/>}/>
   <Stat label="Completed" value={submitted.length} icon={<CheckCircle2/>} tone="green"/>
   <Stat label="Pending" value={pending.length} icon={<Clock3/>} tone="amber"/>
   <Stat label="Teachers" value={teachers.length} icon={<UserRound/>} tone="violet"/>
  </div>
  <section className="overview-card"><h3>Today's Overview</h3><div className="overview-line"><span>Student Attendance</span><strong>{totals.present}/{totals.total} ({pct}%)</strong></div><div className="progress"><span style={{width:pct+'%'}}/></div><div className="overview-statuses"><span className="green">● {totals.present}<small>Present</small></span><span className="red">● {totals.absent}<small>Absent</small></span></div><Link className="primary wide" to="/classes">View Class Status</Link></section>
  {pending.length>0&&<section className="pending"><AlertCircle/><div><strong>Pending Classes</strong><p>{pending.map(c=>c.display_name).join(' · ')}</p></div></section>}
  <section className="class-status-card"><div className="section-heading"><h3>Class Submission Status</h3><Link to="/classes">View all</Link></div>{rows.slice(0,10).map(c=><div className="class-status-row" key={c.id}><strong>{c.display_name}</strong><span className={c.session_id?'status-pill submitted':'status-pill waiting'}>{c.session_id?'✓ Submitted':'Not Submitted'}</span><small>{c.session_id?`${c.present}/${c.total} present`:'—'}</small></div>)}</section>
 </>}
function Stat({label,value,icon,tone='blue'}:{label:string,value:string|number,icon:ReactNode,tone?:string}){return <article className={'admin-stat '+tone}><span>{icon}</span><small>{label}</small><strong>{value}</strong></article>}