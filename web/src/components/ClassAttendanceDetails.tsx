import {useEffect,useMemo,useState} from 'react'
import {api} from '../lib/api'

type RecordRow={record_id:string;student_id:string;admission_number:string;full_name:string;status:'PRESENT'|'ABSENT'|'LATE'}
type RosterStudent={id:string;admission_number:string;full_name:string;class_id:string}

export function ClassAttendanceDetails({sessionId,classId}:{sessionId:string;classId:string}){
 const [records,setRecords]=useState<RecordRow[]>([]),[roster,setRoster]=useState<RosterStudent[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{let active=true;(async()=>{setLoading(true);setError('');try{const [a,c]=await Promise.all([api<{records:RecordRow[]}>(`/api/attendance/${encodeURIComponent(sessionId)}`),api<{students:RosterStudent[]}>(`/api/classes/${encodeURIComponent(classId)}/students`)]);if(active){setRecords(a.records);setRoster(c.students)}}catch{if(active)setError('Could not load student details.')}finally{if(active)setLoading(false)}})();return()=>{active=false}},[sessionId,classId])
 const grouped=useMemo(()=>{
  const rosterIds=new Set(roster.map(s=>s.id))
  const current=records.filter(r=>rosterIds.has(r.student_id))
  const marked=new Set(current.map(r=>r.student_id))
  const byAdmission=<T extends {admission_number:string}>(a:T,b:T)=>String(a.admission_number).localeCompare(String(b.admission_number),undefined,{numeric:true,sensitivity:'base'})
  return{
   present:current.filter(r=>r.status==='PRESENT').sort(byAdmission),
   absent:current.filter(r=>r.status==='ABSENT').sort(byAdmission),
   late:current.filter(r=>r.status==='LATE').sort(byAdmission),
   unmarked:roster.filter(s=>!marked.has(s.id)).sort(byAdmission)
  }
 },[records,roster])
 if(loading)return <div className="class-detail-loading">Loading class attendance…</div>
 if(error)return <div className="class-detail-error">{error}</div>
 return <div className="class-attendance-detail">
   <div className="class-detail-counts">
    <span className="total-count"><strong>{roster.length}</strong><small>Total Students</small></span>
    <span className="present-count"><strong>{grouped.present.length}</strong><small>Present</small></span>
    <span className="absent-count"><strong>{grouped.absent.length}</strong><small>Absent</small></span>
    <span className="unmarked-count"><strong>{grouped.unmarked.length}</strong><small>Not Marked</small></span>
   </div>
   {grouped.unmarked.length>0&&<div className="incomplete-warning">Attendance is incomplete: {grouped.unmarked.length} student{grouped.unmarked.length===1?' is':'s are'} still not marked.</div>}
   <div className="class-detail-lists">
    <section><h4>Present Students <b>{grouped.present.length}</b></h4>{grouped.present.length?grouped.present.map((r,i)=><div className="student-name-row" key={r.record_id}><span>{i+1}</span><div><strong>{r.full_name}</strong><small>{r.admission_number}</small></div></div>):<p className="empty-mini">No present students.</p>}</section>
    <section><h4>Absent Students <b>{grouped.absent.length}</b></h4>{grouped.absent.length?grouped.absent.map((r,i)=><div className="student-name-row absent-name" key={r.record_id}><span>{i+1}</span><div><strong>{r.full_name}</strong><small>{r.admission_number}</small></div></div>):<p className="empty-mini">No absent students.</p>}</section>
    {grouped.unmarked.length>0&&<section className="unmarked-list"><h4>Not Marked Yet <b>{grouped.unmarked.length}</b></h4>{grouped.unmarked.map((s,i)=><div className="student-name-row unmarked-name" key={s.id}><span>{i+1}</span><div><strong>{s.full_name}</strong><small>{s.admission_number}</small></div></div>)}</section>}
   </div>
 </div>
}