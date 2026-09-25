import {useEffect,useState} from 'react'
import {api} from '../lib/api'
import {schoolDate,prettyDate} from '../lib/date'
import {useAuth} from '../AuthContext'
import type {SchoolClass} from '../types'
type P={id:string;period_no:number;subject:string;teacher_name:string|null;status?:string|null}
const choices=[['ARRIVED','ARRIVED'],['NOT_ARRIVED','NOT ARRIVED'],['DELAYED','DELAYED'],['RELIEF','RELIEF'],['NOT_ARRIVED_RELIEF','NOT RELIEF']] as const
export function PeriodAttendance(){const {profile}=useAuth(),date=schoolDate();const admin=profile?.role==='SECTION_HEAD';const [periods,setPeriods]=useState<P[]>([]),[classes,setClasses]=useState<SchoolClass[]>([]),[classId,setClassId]=useState(''),[className,setClassName]=useState(''),[statuses,setStatuses]=useState<Record<string,string>>({}),[msg,setMsg]=useState('')
 useEffect(()=>{if(admin)api<{classes:SchoolClass[]}>('/api/classes').then(x=>{setClasses(x.classes);setClassId(x.classes[0]?.id||'')}).catch(()=>setMsg('Could not load classes.'))},[admin])
 useEffect(()=>{if(admin&&!classId)return;load()},[classId,admin,date])
 async function load(){setMsg('');try{const q=admin?`&class_id=${encodeURIComponent(classId)}`:'';const x:any=await api(`/api/period-attendance/today?date=${date}${q}`);setPeriods(x.periods);setClassName(x.class_name);setStatuses(Object.fromEntries(x.periods.filter((p:P)=>p.status).map((p:P)=>[p.id,p.status])))}catch(e:any){setPeriods([]);setMsg(e.message==='class_teacher_not_assigned'?'You are not assigned as a class teacher.':'Could not load teacher attendance. Please deploy the latest backend migration and Worker.')}}
 async function save(){if(periods.some(p=>!statuses[p.id])){setMsg('Mark every period before saving.');return}try{await api('/api/period-attendance',{method:'POST',body:JSON.stringify({date,class_id:admin?classId:undefined,records:periods.map(p=>({period_id:p.id,status:statuses[p.id]}))})});setMsg('Teacher attendance saved ✓')}catch{setMsg('Could not save teacher attendance.')}}
 return <>
  <div className="screen-title-row"><div><h1>Teachers Attendance & Status</h1><p>{prettyDate(date)}</p></div>{admin?<select value={classId} onChange={e=>setClassId(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select>:className&&<span className="class-chip">{className}</span>}</div>
  {msg&&<div className={msg.includes('✓')?'notice':'error'}>{msg}</div>}
  <div className="teacher-attendance-table"><table><thead><tr><th>Period</th>{choices.map(([v,l])=><th key={v}>{l}</th>)}</tr></thead><tbody>{periods.map(p=><tr key={p.id}><th><span>{p.period_no}</span><small>{p.subject}{p.teacher_name?' · '+p.teacher_name:''}</small></th>{choices.map(([v])=><td key={v}><label className={'status-check '+v.toLowerCase()}><input type="radio" name={'period-'+p.id} checked={statuses[p.id]===v} onChange={()=>setStatuses(s=>({...s,[p.id]:v}))}/><span/></label></td>)}</tr>)}</tbody></table></div>
  {!msg&&periods.length===0&&<div className="empty-card">No periods have been configured for this class yet.</div>}
  {periods.length>0&&<div className="period-legend"><span className="green">● Arrived</span><span className="red">● Not Arrived</span><span className="amber">● Delayed</span><span className="blue">● Relief</span><span className="darkred">● Not Relief</span></div>}
  {periods.length>0&&<button className="submit" onClick={save}>Submit Period Attendance</button>}
 </>}