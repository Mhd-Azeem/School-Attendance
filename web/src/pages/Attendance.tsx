import {useEffect,useMemo,useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {AlertTriangle,CheckCircle2,CloudOff,Search} from 'lucide-react'
import {clearDraft,loadDraft,saveDraft} from '../lib/drafts'
import {schoolDate,prettyDate} from '../lib/date'
import {api} from '../lib/api'
import {totals} from '../lib/attendance'
import type {AttendanceStatus,SchoolClass,Student} from '../types'

export function Attendance(){
 const [params]=useSearchParams(),today=schoolDate()
 const [classes,setClasses]=useState<SchoolClass[]>([]),[classId,setClassId]=useState(params.get('class')||''),[students,setStudents]=useState<Student[]>([])
 const [statuses,setStatuses]=useState<Partial<Record<string,AttendanceStatus>>>({}),[savedIds,setSavedIds]=useState<Set<string>>(new Set()),[missingIds,setMissingIds]=useState<Set<string>>(new Set())
 const [query,setQuery]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[already,setAlready]=useState(false),[warning,setWarning]=useState('')

 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(({classes})=>{setClasses(classes);setClassId(x=>x||classes[0]?.id||'')}).catch(()=>setMessage('Could not load classes.'))},[])

 useEffect(()=>{if(!classId)return;(async()=>{
  setMessage('');setAlready(false);setSavedIds(new Set());setMissingIds(new Set());setStatuses({})
  try{
   const {students:s}=await api<{students:Student[]}>(`/api/classes/${encodeURIComponent(classId)}/students`)
   setStudents(s)
   const draft=loadDraft(classId,today)
   const next:Partial<Record<string,AttendanceStatus>>={}
   for(const st of s){
    const d=draft?.statuses?.[st.id]
    if(d==='PRESENT'||d==='ABSENT')next[st.id]=d
   }
   try{
    const h=await api<{sessions:any[]}>(`/api/history?class_id=${encodeURIComponent(classId)}&from=${today}&to=${today}`)
    const session=h.sessions[0]
    if(session){
     const d=await api<{records:any[]}>(`/api/attendance/${encodeURIComponent(session.session_id)}`)
     const existing=new Set<string>()
     for(const r of d.records){
      if(s.some(st=>st.id===r.student_id)){
       next[r.student_id]=r.status==='ABSENT'?'ABSENT':'PRESENT'
       existing.add(r.student_id)
      }
     }
     setSavedIds(existing)
     if(existing.size>=s.length){
      setAlready(true);setMessage('Attendance has already been fully submitted.')
     }
    }
   }catch{}
   setStatuses(next)
  }catch{
   setStudents([]);setStatuses({});setMessage('Could not load students for this class.')
  }
 })()},[classId,today])

 useEffect(()=>{if(classId&&Object.keys(statuses).length)saveDraft({classId,date:today,statuses,updatedAt:new Date().toISOString()})},[classId,statuses,today])

 const count=useMemo(()=>totals(statuses),[statuses])
 const filtered=students.filter(s=>`${s.admission_number} ${s.full_name}`.toLowerCase().includes(query.toLowerCase()))
 const selected=classes.find(c=>c.id===classId)

 function mark(id:string,status:AttendanceStatus){
  if(savedIds.has(id))return
  setStatuses(x=>({...x,[id]:status}))
  setMissingIds(x=>{const n=new Set(x);n.delete(id);return n})
  setWarning('')
 }

 async function submit(){
  if(!navigator.onLine){setMessage('Attendance could not be submitted. Your changes are still saved on this device.');return}
  const missing=students.filter(s=>!statuses[s.id])
  if(missing.length){
   setMissingIds(new Set(missing.map(s=>s.id)))
   const names=missing.slice(0,3).map(s=>s.full_name).join(', ')
   const extra=missing.length>3?` and ${missing.length-3} more`:''
   setWarning(`You missed ${missing.length} student${missing.length===1?'':'s'}: ${names}${extra}. Please select Present or Absent for every student before submitting.`)
   setTimeout(()=>document.getElementById(`student-${missing[0].id}`)?.scrollIntoView({behavior:'smooth',block:'center'}),50)
   return
  }
  if(!confirm(`Submit attendance for Class ${selected?.display_name} for ${prettyDate(today)}?\n\nPresent: ${count.present}  Absent: ${count.absent}`))return
  setBusy(true);setMessage('')
  try{
   await api('/api/attendance',{method:'POST',body:JSON.stringify({class_id:classId,date:today,records:students.map(s=>({student_id:s.id,status:statuses[s.id] as AttendanceStatus}))})})
   clearDraft(classId,today);setAlready(true);setMissingIds(new Set())
   setMessage(savedIds.size?'Attendance completed for all current students ✓':'Attendance Submitted ✓')
  }catch(e){
   const m=e instanceof Error?e.message:''
   if(m==='attendance_already_submitted'){setAlready(true);setMessage('Attendance has already been submitted.')}
   else if(m==='not_a_school_day')setMessage('Attendance cannot be submitted because today is not a school day.')
   else if(m==='incomplete_or_invalid_register')setMessage('Attendance is incomplete. Please make sure every student has either Present or Absent selected.')
   else setMessage('Attendance could not be submitted. Your changes are still saved on this device.')
  }finally{setBusy(false)}
 }

 return <>
  <div className="screen-title-row"><div><h1>Student Attendance</h1><p>{prettyDate(today)}</p></div><select value={classId} onChange={e=>setClassId(e.target.value)} aria-label="Class">{classes.map(c=><option value={c.id} key={c.id}>{c.display_name}</option>)}</select></div>
  <div className="attendance-summary"><article><small>Total</small><strong>{students.length}</strong></article><article className="present-card"><small>Present</small><strong>{count.present}</strong></article><article className="absent-card"><small>Absent</small><strong>{count.absent}</strong></article></div>
  {!navigator.onLine&&<div className="offline"><CloudOff/> Offline — this unfinished register is saved on this device.</div>}
  {already?<section className="success-panel"><CheckCircle2/><h2>Attendance Submitted</h2><p>This class already has a confirmed register for today.</p></section>:<>
   <label className="search modern-search"><Search/><input placeholder="Search student name…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <button className="mark-all" onClick={()=>{setStatuses(prev=>Object.fromEntries(students.map(s=>[s.id,savedIds.has(s.id)?prev[s.id]:'PRESENT'])));setMissingIds(new Set())}}>✓ Mark all unmarked students present</button>
   {message&&<div className={message.includes('✓')?'notice':'error'}>{message}</div>}
   <section className="student-table"><div className="student-head"><span>#</span><span>Name</span><span>Status</span></div>{filtered.map((s,i)=><article id={`student-${s.id}`} className={missingIds.has(s.id)?'attendance-missing':''} key={s.id}><span>{i+1}</span><div><strong>{s.full_name}</strong><small>{s.admission_number}</small>{missingIds.has(s.id)&&<em className="missing-label">Select Present or Absent</em>}</div><div className="status-control">{(['PRESENT','ABSENT'] as const).map(status=><button key={status} disabled={savedIds.has(s.id)} className={`${statuses[s.id]===status?status.toLowerCase():''}${savedIds.has(s.id)?' saved-status':''}`} onClick={()=>mark(s.id,status)} aria-pressed={statuses[s.id]===status}>{status==='PRESENT'?'● Present':'● Absent'}</button>)}</div></article>)}</section>
   <button className="submit" disabled={busy||!students.length} onClick={submit}>{busy?'Submitting…':'Save Attendance'}</button>
   {warning&&<div className="attendance-popup-backdrop" role="dialog" aria-modal="true" aria-labelledby="attendance-warning-title"><div className="attendance-popup"><span className="attendance-popup-icon"><AlertTriangle/></span><h3 id="attendance-warning-title">Attendance Incomplete</h3><p>{warning}</p><button className="primary wide" onClick={()=>setWarning('')}>OK, Check Students</button></div></div>}
  </>}
 </>
}