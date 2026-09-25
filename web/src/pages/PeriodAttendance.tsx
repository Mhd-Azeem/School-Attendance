import {useEffect,useState} from 'react'
import {api} from '../lib/api'
import {schoolDate,prettyDate} from '../lib/date'
import {useAuth} from '../AuthContext'
import type {SchoolClass} from '../types'

type P={id:string;period_no:number;status?:string|null}
const choices=[['ARRIVED','ARRIVED'],['NOT_ARRIVED','NOT ARRIVED'],['DELAYED','DELAYED'],['RELIEF','RELIEF'],['NOT_ARRIVED_RELIEF','NO TEACHER PRESENTED']] as const
const ordinal=(n:number)=>['','1st Period','2nd Period','3rd Period','4th Period','5th Period','6th Period','7th Period','8th Period','9th Period'][n]||`Period ${n}`

export function PeriodAttendance(){
 const {profile}=useAuth(),admin=profile?.role==='SECTION_HEAD'
 const [date,setDate]=useState(schoolDate())
 const [periods,setPeriods]=useState<P[]>([]),[classes,setClasses]=useState<SchoolClass[]>([]),[classId,setClassId]=useState(''),[className,setClassName]=useState(''),[statuses,setStatuses]=useState<Record<string,string>>({}),[msg,setMsg]=useState('')

 useEffect(()=>{if(admin)api<{classes:SchoolClass[]}>('/api/classes').then(x=>{setClasses(x.classes);setClassId(x.classes[0]?.id||'')}).catch(()=>setMsg('Could not load classes.'))},[admin])
 useEffect(()=>{if(admin&&!classId)return;load()},[classId,admin,date])

 async function load(){
  setMsg('')
  try{
   const q=admin?`&class_id=${encodeURIComponent(classId)}`:''
   const x:any=await api(`/api/period-attendance/today?date=${date}${q}`)
   setPeriods(x.periods);setClassName(x.class_name)
   setStatuses(Object.fromEntries(x.periods.filter((p:P)=>p.status).map((p:P)=>[p.id,p.status])))
  }catch(e:any){
   setPeriods([])
   setMsg(e.message==='class_teacher_not_assigned'?'You are not assigned as a class teacher.':'Could not load teacher attendance.')
  }
 }

 async function save(){
  if(periods.some(p=>!statuses[p.id])){setMsg('Mark every period before saving.');return}
  try{
   await api('/api/period-attendance',{method:'POST',body:JSON.stringify({date,class_id:admin?classId:undefined,records:periods.map(p=>({period_id:p.id,status:statuses[p.id]}))})})
   setMsg('Register submitted to Section Head ✓ You can edit and resubmit it anytime.')
  }catch{setMsg('Could not save teacher attendance.')}
 }

 return <>
  <div className="screen-title-row period-title-row"><div><h1>Teachers Attendance & Status</h1><p>{prettyDate(date)}</p></div><div className="period-top-controls"><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value||schoolDate())}/></label>{admin?<select value={classId} onChange={e=>setClassId(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select>:className&&<span className="class-chip">{className}</span>}</div></div>
  <div className="period-date-picker"><label>Register Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} max={schoolDate()}/></label><small>Default is today. Select an earlier date to view, edit or resubmit that register.</small></div>
  {msg&&<div className={msg.includes('✓')?'notice':'error'}>{msg}</div>}
  <div className="period-status-cards">
   {periods.map(p=><article className="period-status-card" key={p.id}>
    <strong>{ordinal(p.period_no)}</strong>
    <div className="period-choice-grid">{choices.map(([v,l])=><button type="button" key={v} className={'period-choice '+v.toLowerCase()+(statuses[p.id]===v?' selected':'')} onClick={()=>setStatuses(s=>({...s,[p.id]:v}))}><span className="period-choice-dot"/><small>{l}</small></button>)}</div>
   </article>)}
  </div>
  {!msg&&periods.length===0&&<div className="empty-card">No periods have been configured for this class yet.</div>}
  {periods.length>0&&<div className="period-legend"><span className="green">● Arrived</span><span className="red">● Not Arrived</span><span className="amber">● Delayed</span><span className="blue">● Relief</span><span className="darkred">● No Teacher Presented</span></div>}
  {periods.length>0&&<button className="submit" onClick={save}>{periods.some(p=>p.status)?'Update / Resubmit Register':'Submit Register to Section Head'}</button>}
 </>
}