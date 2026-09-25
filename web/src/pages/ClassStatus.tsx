import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {ChevronDown} from 'lucide-react'
import {api} from '../lib/api'
import {prettyDate,schoolDate} from '../lib/date'
import type {SchoolClass} from '../types'
import {ClassAttendanceDetails} from '../components/ClassAttendanceDetails'

type Period={id:string;period_no:number;status?:string|null}
type Row=SchoolClass&{session_id:string|null;studentSubmitted:boolean;periodDone:number;periodTotal:number;marked:number;total:number;periods:Period[]}
const statusLabel=(s?:string|null)=>s==='ARRIVED'?'Arrived':s==='NOT_ARRIVED'?'Not Arrived':s==='DELAYED'?'Delayed':s==='RELIEF'?'Relief':s==='NOT_ARRIVED_RELIEF'?'No Teacher Presented':'Not Marked'

export function ClassStatus(){
 const today=schoolDate()
 const [rows,setRows]=useState<Row[]>([]),[error,setError]=useState(''),[expanded,setExpanded]=useState<string|null>(null)
 useEffect(()=>{(async()=>{try{
  const d=await api<{classes:any[]}>(`/api/dashboard/today?date=${today}`)
  const out:Row[]=await Promise.all(d.classes.map(async c=>{
   let periods:Period[]=[]
   try{periods=(await api<{periods:Period[]}>(`/api/period-attendance/today?date=${today}&class_id=${encodeURIComponent(c.id)}`)).periods}catch{}
   const marked=Number(c.marked??(Number(c.present||0)+Number(c.absent||0)+Number(c.late||0)))
   return{...c,studentSubmitted:!!c.session_id&&marked>=Number(c.total||0),marked,periodDone:periods.filter(x=>x.status).length,periodTotal:periods.length,periods}
  }))
  setRows(out)
 }catch{setError('Could not load class submission status.')}})()},[today])

 return <><div className="screen-title-row"><div><h1>Class Submission Status</h1><p>{prettyDate(today)}</p></div><Link className="secondary" to="/students">Manage Students</Link></div>
 {error&&<div className="error">{error}</div>}
 <section className="class-table"><div className="class-table-head"><span>Class</span><span>Student</span><span>Teacher Period</span><span>Status</span></div>
 {rows.map(r=>{const periodComplete=r.periodTotal===9&&r.periodDone===9,full=r.studentSubmitted&&periodComplete,partial=r.studentSubmitted||r.periodDone>0,canExpand=!!r.session_id||r.periodDone>0
  return <div className="class-table-item" key={r.id}>
   <button className="class-table-row-button" disabled={!canExpand} onClick={()=>canExpand&&setExpanded(expanded===r.id?null:r.id)}>
    <strong>{r.display_name}</strong><span>{r.session_id?`${r.marked}/${r.total}`:'✕'}</span><span>{r.periodTotal?`${r.periodDone}/9`:'0/9'}</span>
    <em className={full?'status-pill submitted':partial?'status-pill progress':'status-pill waiting'}>{full?'Submitted':partial?'In Progress':'Not Submitted'}</em>{canExpand&&<ChevronDown className={expanded===r.id?'rotated':''}/>}
   </button>
   {expanded===r.id&&canExpand&&<div className="section-head-expanded-results">
    {r.session_id&&<ClassAttendanceDetails sessionId={r.session_id} classId={r.id}/>}
    {r.periodDone>0&&<section className="period-result-card"><h4>Teacher Attendance & Status</h4><div className="period-result-list">{r.periods.map(p=><div key={p.id}><strong>{p.period_no}{p.period_no===1?'st':p.period_no===2?'nd':p.period_no===3?'rd':'th'} Period</strong><span className={'period-result-status '+(p.status||'').toLowerCase()}>{statusLabel(p.status)}</span></div>)}</div></section>}
   </div>}
  </div>})}</section></>
}