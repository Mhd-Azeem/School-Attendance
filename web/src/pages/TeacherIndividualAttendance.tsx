import {useEffect,useMemo,useState} from 'react'
import {Search} from 'lucide-react'
import {api} from '../lib/api'

type SchoolClass={id:string;display_name:string}
type Row={student_id:string;admission_number:string;full_name:string;display_name:string;present:number;absent:number;total:number}

export function TeacherIndividualAttendance(){
 const [classes,setClasses]=useState<SchoolClass[]>([]),[rows,setRows]=useState<Row[]>([]),[search,setSearch]=useState(''),[grade,setGrade]=useState('ALL'),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{let alive=true;(async()=>{try{
  const c=await api<{classes:SchoolClass[]}>('/api/classes');if(!alive)return;setClasses(c.classes)
  const totals=new Map<string,Row>()
  for(const cls of c.classes){
   const h=await api<{sessions:any[]}>(`/api/history?class_id=${encodeURIComponent(cls.id)}`)
   for(const session of h.sessions){
    const d=await api<{records:any[]}>(`/api/attendance/${encodeURIComponent(session.session_id)}`)
    for(const r of d.records){const key=String(r.student_id);const current=totals.get(key)||{student_id:key,admission_number:String(r.admission_number||''),full_name:String(r.full_name||''),display_name:cls.display_name,present:0,absent:0,total:0};current.total++;if(r.status==='PRESENT'||r.status==='LATE')current.present++;else if(r.status==='ABSENT')current.absent++;totals.set(key,current)}
   }
  }
  if(alive){setRows([...totals.values()]);setError('')}
 }catch{if(alive)setError('Could not load individual attendance.')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[])
 const grades=Array.from(new Set(classes.map(c=>String(c.display_name).split('-')[0].trim()))).sort()
 const filtered=useMemo(()=>rows.filter(r=>(grade==='ALL'||String(r.display_name).startsWith(grade+'-'))&&(!search.trim()||`${r.full_name} ${r.admission_number}`.toLowerCase().includes(search.trim().toLowerCase()))).sort((a,b)=>String(a.display_name).localeCompare(String(b.display_name))||String(a.admission_number).localeCompare(String(b.admission_number),undefined,{numeric:true})),[rows,grade,search])
 return <><div className="screen-title-row"><div><h1>Individual Attendance</h1><p>Attendance count for each student in your assigned classes.</p></div></div>
 <div className="filters"><label className="search modern-search"><Search/><input placeholder="Search name or admission number…" value={search} onChange={e=>setSearch(e.target.value)}/></label><select value={grade} onChange={e=>setGrade(e.target.value)}><option value="ALL">All Grades</option>{grades.map(g=><option key={g} value={g}>Grade {g}</option>)}</select></div>
 {loading&&<div className="loading">Loading attendance…</div>}{error&&<div className="error">{error}</div>}
 <section className="report-list">{filtered.map(r=><article key={r.student_id}><div><small>{r.admission_number} · {r.display_name}</small><strong>{r.full_name}</strong></div><span className="green"><strong>{r.present}</strong> attended</span><span className="red"><strong>{r.absent}</strong> absent</span><strong>{r.present}/{r.total} days</strong></article>)}</section>
 {!loading&&!error&&!filtered.length&&<div className="empty-card">No matching students.</div>}</>
}
