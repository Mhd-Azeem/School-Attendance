import {useEffect,useMemo,useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {CheckCircle2,CloudOff,Search} from 'lucide-react'
import {clearDraft,loadDraft,saveDraft} from '../lib/drafts'
import {schoolDate,prettyDate} from '../lib/date'
import {api} from '../lib/api'
import {totals} from '../lib/attendance'
import type {AttendanceStatus,SchoolClass,Student} from '../types'
export function Attendance(){const [params]=useSearchParams(),today=schoolDate();const [classes,setClasses]=useState<SchoolClass[]>([]),[classId,setClassId]=useState(params.get('class')||''),[students,setStudents]=useState<Student[]>([]),[statuses,setStatuses]=useState<Record<string,AttendanceStatus>>({}),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[already,setAlready]=useState(false)
 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(({classes})=>{setClasses(classes);setClassId(x=>x||classes[0]?.id||'')}).catch(()=>setMessage('Could not load classes.'))},[])
 useEffect(()=>{if(!classId)return;(async()=>{setMessage('');setAlready(false);try{const {students:s}=await api<{students:Student[]}>(`/api/classes/${encodeURIComponent(classId)}/students`);setStudents(s);const draft=loadDraft(classId,today);setStatuses(draft?.statuses||Object.fromEntries(s.map(x=>[x.id,'PRESENT'])))}catch{setStudents([]);setMessage('Could not load students for this class.')}})()},[classId,today])
 useEffect(()=>{if(classId&&Object.keys(statuses).length)saveDraft({classId,date:today,statuses,updatedAt:new Date().toISOString()})},[classId,statuses,today])
 const count=useMemo(()=>totals(statuses),[statuses]),filtered=students.filter(s=>`${s.admission_number} ${s.full_name}`.toLowerCase().includes(query.toLowerCase())),selected=classes.find(c=>c.id===classId)
 function mark(id:string,status:AttendanceStatus){setStatuses(x=>({...x,[id]:status}))}
 async function submit(){if(!navigator.onLine){setMessage('Attendance could not be submitted. Your changes are still saved on this device.');return}if(Object.keys(statuses).length!==students.length){setMessage('Every active student needs a status.');return}if(!confirm(`Submit attendance for Class ${selected?.display_name} for ${prettyDate(today)}?\n\nPresent: ${count.present}  Absent: ${count.absent}`))return;setBusy(true);setMessage('');try{await api('/api/attendance',{method:'POST',body:JSON.stringify({class_id:classId,date:today,records:students.map(s=>({student_id:s.id,status:statuses[s.id]}))})});clearDraft(classId,today);setAlready(true);setMessage('Attendance Submitted ✓')}catch(e){const m=e instanceof Error?e.message:'';if(m==='attendance_already_submitted'){setAlready(true);setMessage('Attendance has already been submitted.')}else if(m==='not_a_school_day')setMessage('Attendance cannot be submitted because today is not a school day.');else setMessage('Attendance could not be submitted. Your changes are still saved on this device.')}finally{setBusy(false)}}
 return <>
  <div className="screen-title-row"><div><h1>Student Attendance</h1><p>{prettyDate(today)}</p></div><select value={classId} onChange={e=>setClassId(e.target.value)} aria-label="Class">{classes.map(c=><option value={c.id} key={c.id}>{c.display_name}</option>)}</select></div>
  <div className="attendance-summary"><article><small>Total</small><strong>{students.length}</strong></article><article className="present-card"><small>Present</small><strong>{count.present}</strong></article><article className="absent-card"><small>Absent</small><strong>{count.absent}</strong></article></div>
  {!navigator.onLine&&<div className="offline"><CloudOff/> Offline — this unfinished register is saved on this device.</div>}
  {already?<section className="success-panel"><CheckCircle2/><h2>Attendance Submitted</h2><p>This class already has a confirmed register for today.</p></section>:<>
   <label className="search modern-search"><Search/><input placeholder="Search student name…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <button className="mark-all" onClick={()=>setStatuses(Object.fromEntries(students.map(s=>[s.id,'PRESENT'])))}>✓ Mark all present</button>
   <section className="student-table"><div className="student-head"><span>#</span><span>Name</span><span>Status</span></div>{filtered.map((s,i)=><article key={s.id}><span>{i+1}</span><div><strong>{s.full_name}</strong><small>{s.admission_number}</small></div><div className="status-control">{(['PRESENT','ABSENT'] as const).map(status=><button key={status} className={statuses[s.id]===status?status.toLowerCase():''} onClick={()=>mark(s.id,status)} aria-pressed={statuses[s.id]===status}>{status==='PRESENT'?'● Present':'● Absent'}</button>)}</div></article>)}</section>
   {message&&<div className={message.includes('✓')?'notice':'error'}>{message}</div>}<button className="submit" disabled={busy||!students.length} onClick={submit}>{busy?'Submitting…':'Save Attendance'}</button>
  </>}
 </>}