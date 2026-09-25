import {useEffect,useMemo,useState} from 'react'
import {api} from '../lib/api'

type RecordRow={record_id:string;student_id:string;admission_number:string;full_name:string;status:'PRESENT'|'ABSENT'|'LATE'}

export function ClassAttendanceDetails({sessionId}:{sessionId:string}){
 const [records,setRecords]=useState<RecordRow[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{let active=true;(async()=>{setLoading(true);setError('');try{const x=await api<{records:RecordRow[]}>(`/api/attendance/${encodeURIComponent(sessionId)}`);if(active)setRecords(x.records)}catch{if(active)setError('Could not load student details.')}finally{if(active)setLoading(false)}})();return()=>{active=false}},[sessionId])
 const grouped=useMemo(()=>({
  present:records.filter(r=>r.status==='PRESENT'),
  absent:records.filter(r=>r.status==='ABSENT'),
  late:records.filter(r=>r.status==='LATE')
 }),[records])
 if(loading)return <div className="class-detail-loading">Loading class attendance…</div>
 if(error)return <div className="class-detail-error">{error}</div>
 return <div className="class-attendance-detail">
   <div className="class-detail-counts">
    <span className="present-count"><strong>{grouped.present.length}</strong><small>Present</small></span>
    <span className="absent-count"><strong>{grouped.absent.length}</strong><small>Absent</small></span>
    {grouped.late.length>0&&<span className="late-count"><strong>{grouped.late.length}</strong><small>Late</small></span>}
   </div>
   <div className="class-detail-lists">
    <section><h4>Present Students <b>{grouped.present.length}</b></h4>{grouped.present.length?grouped.present.map((r,i)=><div className="student-name-row" key={r.record_id}><span>{i+1}</span><div><strong>{r.full_name}</strong><small>{r.admission_number}</small></div></div>):<p className="empty-mini">No present students.</p>}</section>
    <section><h4>Absent Students <b>{grouped.absent.length}</b></h4>{grouped.absent.length?grouped.absent.map((r,i)=><div className="student-name-row absent-name" key={r.record_id}><span>{i+1}</span><div><strong>{r.full_name}</strong><small>{r.admission_number}</small></div></div>):<p className="empty-mini">No absent students.</p>}</section>
   </div>
 </div>
}