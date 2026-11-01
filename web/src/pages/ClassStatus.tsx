import {useEffect,useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {ChevronDown,RefreshCw} from 'lucide-react'
import {api} from '../lib/api'
import {prettyDate,schoolDate} from '../lib/date'
import type {SchoolClass} from '../types'

type Period={id:string;period_no:number;status?:string|null}
type Row=SchoolClass&{session_id:string|null;studentSubmitted:boolean;periodDone:number;periodTotal:number;marked:number;total:number;present:number;absent:number;periods:Period[]}
const statusLabel=(s?:string|null)=>s==='ARRIVED'?'Arrived':s==='NOT_ARRIVED'?'Not Arrived':s==='DELAYED'?'Delayed':s==='RELIEF'?'Relief':s==='NOT_ARRIVED_RELIEF'?'No Teacher Presented':'Not Marked'
const gradeName=(r:Row)=>String((r as any).grade_name||r.display_name||'').split('-')[0].trim()||'Other'

export function ClassStatus(){
 const today=schoolDate()
 const [date,setDate]=useState(today),[rows,setRows]=useState<Row[]>([]),[error,setError]=useState(''),[expandedClass,setExpandedClass]=useState<string|null>(null),[expandedGrades,setExpandedGrades]=useState<Set<string>>(new Set()),[refreshKey,setRefreshKey]=useState(0),[loading,setLoading]=useState(false)

 useEffect(()=>{(async()=>{setLoading(true);setError('');try{
  const d=await api<{classes:any[]}>('/api/dashboard/today?date='+date+'&_='+Date.now())
  const out:Row[]=await Promise.all(d.classes.map(async c=>{
   const classId=String(c.class_id??c.id)
   let periods:Period[]=[]
   try{periods=(await api<{periods:Period[]}>('/api/period-attendance/today?date='+date+'&class_id='+encodeURIComponent(classId)+'&_='+Date.now())).periods}catch{}
   const marked=Number(c.marked??(Number(c.present||0)+Number(c.absent||0)+Number(c.late||0)))
   return{...c,id:classId,studentSubmitted:!!c.session_id&&marked>=Number(c.total||0),marked,periodDone:periods.filter(x=>x.status).length,periodTotal:periods.length,periods}
  }))
  setRows(out)
  setExpandedGrades(prev=>prev.size?prev:new Set([...new Set(out.map(gradeName))].slice(0,1)))
 }catch{setError('Could not load class submission status.')}finally{setLoading(false)}})()},[date,refreshKey])

 const gradeGroups=useMemo(()=>{
  const map=new Map<string,Row[]>()
  for(const row of rows){const g=gradeName(row);if(!map.has(g))map.set(g,[]);map.get(g)!.push(row)}
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true,sensitivity:'base'})).map(([grade,items])=>({grade,items:items.sort((a,b)=>a.display_name.localeCompare(b.display_name,undefined,{numeric:true,sensitivity:'base'}))}))
 },[rows])

 function toggleGrade(grade:string){setExpandedGrades(prev=>{const next=new Set(prev);next.has(grade)?next.delete(grade):next.add(grade);return next})}

 return <><div className="screen-title-row"><div><h1>Class Submission Status</h1><p>{prettyDate(date)}</p></div><div className="class-status-actions"><button className="secondary refresh-status" onClick={()=>setRefreshKey(x=>x+1)} disabled={loading}><RefreshCw className={loading?'spin':''}/> {loading?'Refreshing…':'Refresh'}</button><Link className="secondary" to="/students">Manage Students</Link></div></div><div className="section-head-date-filter"><label>Submission Date<input type="date" value={date} onChange={e=>{setDate(e.target.value);setExpandedClass(null)}} max={today}/></label></div>
 {error&&<div className="error">{error}</div>}
 <section className="grade-status-groups">
  {gradeGroups.map(({grade,items})=>{
   const open=expandedGrades.has(grade)
   const submitted=items.filter(r=>r.studentSubmitted&&r.periodTotal===9&&r.periodDone===9).length
   const inProgress=items.filter(r=>!(r.studentSubmitted&&r.periodTotal===9&&r.periodDone===9)&&(r.studentSubmitted||r.periodDone>0)).length
   return <section className="grade-status-card" key={grade}>
    <button type="button" className="grade-status-header" onClick={()=>toggleGrade(grade)} aria-expanded={open}>
     <div><strong>Grade {grade}</strong><small>{items.length} class{items.length===1?'':'es'} · {submitted} submitted{inProgress?' · '+inProgress+' in progress':''}</small></div>
     <ChevronDown className={open?'rotated':''}/>
    </button>
    {open&&<div className="grade-status-classes">
     <div className="class-table-head"><span>Class</span><span>Student</span><span>Teacher Period</span><span>Status</span></div>
     {items.map(r=>{const periodComplete=r.periodTotal===9&&r.periodDone===9,full=r.studentSubmitted&&periodComplete,partial=r.studentSubmitted||r.periodDone>0
      return <div className="class-table-item" key={r.id}>
       <button className="class-table-row-button" onClick={()=>{const id=String(r.id);setExpandedClass(prev=>prev===id?null:id)}} aria-expanded={expandedClass===String(r.id)}>
        <strong>{r.display_name}</strong><span>{r.session_id?(r.marked+'/'+r.total):'✕'}</span><span>{r.periodTotal?(r.periodDone+'/9'):'0/9'}</span>
        <em className={full?'status-pill submitted':partial?'status-pill progress':'status-pill waiting'}>{full?'Submitted':partial?'In Progress':'Not Submitted'}</em><ChevronDown className={expandedClass===String(r.id)?'rotated':''}/>
       </button>
       {expandedClass===String(r.id)&&<div className="section-head-expanded-results">
        {r.session_id&&<div className="class-attendance-detail"><div className="class-detail-counts"><span className="total-count"><strong>{r.total}</strong><small>Total Students</small></span><span className="present-count"><strong>{Number(r.present||0)}</strong><small>Present</small></span><span className="absent-count"><strong>{Number(r.absent||0)}</strong><small>Absent</small></span><span className="unmarked-count"><strong>{Math.max(0,Number(r.total||0)-Number(r.marked||0))}</strong><small>Not Marked</small></span></div><div className="section-head-register-note">Student register submitted. Counts shown directly from the submitted register.</div></div>}
        <section className="period-result-card"><h4>Teacher Attendance & Status</h4>{r.periods.length?<div className="period-result-list">{r.periods.map(p=><div key={p.id}><strong>{p.period_no}{p.period_no===1?'st':p.period_no===2?'nd':p.period_no===3?'rd':'th'} Period</strong><span className={'period-result-status '+(p.status||'').toLowerCase()}>{statusLabel(p.status)}</span></div>)}</div>:<p className="period-empty">No teacher-period register has been submitted for this date.</p>}</section>
       </div>}
      </div>})}
    </div>}
   </section>
  })}
  {!gradeGroups.length&&!loading&&<div className="empty-card">No classes found.</div>}
 </section></>
}
