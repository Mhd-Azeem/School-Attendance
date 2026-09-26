import {useEffect,useMemo,useState} from 'react'
import {api} from '../lib/api'
import type {SchoolClass} from '../types'
import {useAuth} from '../AuthContext'
import {AlertTriangle,Search,Trash2} from 'lucide-react'
export function History(){const [mode,setMode]=useState<'student'|'period'>('student'),[classes,setClasses]=useState<SchoolClass[]>([]),[classId,setClassId]=useState(''),[rows,setRows]=useState<any[]>([]);useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(x=>{setClasses(x.classes);setClassId(x.classes[0]?.id||'')})},[]);useEffect(()=>{if(!classId)return;if(mode==='student')api<{sessions:any[]}>(`/api/history?class_id=${classId}`).then(x=>setRows(x.sessions)).catch(()=>setRows([]));else api<{history:any[]}>(`/api/period-history?class_id=${classId}`).then(x=>setRows(x.history)).catch(()=>setRows([]))},[classId,mode]);return <><div className="screen-title-row"><div><h1>Teacher History</h1><p>Review previously submitted registers.</p></div><select value={classId} onChange={e=>setClassId(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></div><div className="segmented"><button className={mode==='student'?'active':''} onClick={()=>setMode('student')}>Student</button><button className={mode==='period'?'active':''} onClick={()=>setMode('period')}>Teacher Period</button></div><section className="history-list">{rows.map((r,i)=><article key={r.session_id||r.attendance_date||i}><div><strong>{r.attendance_date}</strong><small>{r.display_name}</small></div>{mode==='student'?<><span className="status-pill submitted">✓ Submitted</span><small>P {r.present} · A {r.absent}</small></>:<><span className={Number(r.completed)===Number(r.total)?'status-pill submitted':'status-pill progress'}>{r.completed}/{r.total} Completed</span><small>{r.updated_at||''}</small></>}</article>)}</section></>}
export function Reports(){
 const [classes,setClasses]=useState<SchoolClass[]>([]),[cid,setCid]=useState(''),[rows,setRows]=useState<any[]>([]),[periodRows,setPeriodRows]=useState<any[]>([]),[tab,setTab]=useState<'student'|'period'>('student'),[msg,setMsg]=useState(''),[from,setFrom]=useState(new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10)),[to,setTo]=useState(new Date().toISOString().slice(0,10))
 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(x=>{setClasses(x.classes);setCid(x.classes[0]?.id||'')})},[])
 async function load(){setMsg('');try{if(tab==='student'){const x=await api<{report:any[]}>(`/api/reports?from=${from}&to=${to}${cid?`&class_id=${encodeURIComponent(cid)}`:''}`);setRows(x.report)}else{if(!cid){setMsg('Select a class for the teacher-period report.');return}const x=await api<{history:any[]}>(`/api/period-history?from=${from}&to=${to}&class_id=${encodeURIComponent(cid)}`);setPeriodRows(x.history)}}catch{setMsg('Could not generate report.')}}
 function download(name:string,data:string){const blob=new Blob(['\uFEFF'+data],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
 function csv(){if(tab==='student'){const data=['Admission,Name,Class,Total,Present,Absent,Attendance %',...rows.map(r=>[r.admission_number,r.full_name,r.display_name,r.total,r.present,r.absent,r.attendance_percentage??''].map((x:any)=>`"${String(x).replaceAll('"','""')}"`).join(','))].join('\r\n');download('student-attendance-report.csv',data)}else{const data=['Date,Class,Periods Completed,Total Periods,Last Updated',...periodRows.map(r=>[r.attendance_date,r.display_name,r.completed,r.total,r.updated_at??''].map((x:any)=>`"${String(x).replaceAll('"','""')}"`).join(','))].join('\r\n');download('teacher-period-report.csv',data)}}
 const current=tab==='student'?rows:periodRows
 return <><div className="screen-title-row"><div><h1>Reports</h1><p>Student and teacher-period attendance reports with CSV export.</p></div></div>
 <div className="segmented"><button className={tab==='student'?'active':''} onClick={()=>{setTab('student');setMsg('')}}>Student</button><button className={tab==='period'?'active':''} onClick={()=>{setTab('period');setMsg('')}}>Teacher Period</button></div>
 <div className="filters"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" value={to} onChange={e=>setTo(e.target.value)}/><select value={cid} onChange={e=>setCid(e.target.value)}><option value="">{tab==='student'?'All classes':'Select class'}</option>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select><button className="primary" onClick={load}>Generate</button><button className="secondary" disabled={!current.length} onClick={csv}>Export CSV</button></div>
 {msg&&<div className="error">{msg}</div>}
 {tab==='student'?<section className="report-list">{rows.map(r=><article key={r.student_id}><div><small>{r.admission_number} · {r.display_name}</small><strong>{r.full_name}</strong></div><span className="green">P {r.present}</span><span className="red">A {r.absent}</span><strong>{r.attendance_percentage??'—'}%</strong></article>)}</section>:<section className="report-list">{periodRows.map((r,i)=><article key={r.attendance_date+'-'+i}><div><small>{r.attendance_date} · {r.display_name}</small><strong>Teacher Period Register</strong></div><span className="green">{r.completed}/{r.total}</span><strong>{Number(r.completed)===Number(r.total)?'Complete':'Incomplete'}</strong></article>)}</section>}
 </>}
export function Calendar(){const [rows,setRows]=useState<any[]>([]),[day,setDay]=useState(''),[type,setType]=useState('HOLIDAY'),[label,setLabel]=useState('');async function load(){setRows((await api<{days:any[]}>('/api/calendar')).days)}useEffect(()=>{load()},[]);return <><div className="screen-title-row"><div><h1>School Calendar</h1><p>School days, holidays and special days.</p></div></div><form className="filters" onSubmit={async e=>{e.preventDefault();await api('/api/calendar',{method:'POST',body:JSON.stringify({day,day_type:type,label})});setDay('');setLabel('');load()}}><input required type="date" value={day} onChange={e=>setDay(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option>HOLIDAY</option><option>SPECIAL_HOLIDAY</option><option>SPECIAL_SCHOOL_DAY</option><option>SCHOOL_DAY</option><option>WEEKEND</option></select><input placeholder="Label / reason" value={label} onChange={e=>setLabel(e.target.value)}/><button className="primary">Save Day</button></form><section className="data-list">{rows.map(r=><article key={r.day}><div><strong>{r.day}</strong><small>{r.label||'No label'}</small></div><span>{r.day_type}</span><button className="link" onClick={async()=>{await api(`/api/calendar?day=${r.day}`,{method:'DELETE'});load()}}>Remove</button></article>)}</section></>}
export function Audit(){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{api<{logs:any[]}>('/api/audit').then(x=>setRows(x.logs))},[]);return <><div className="screen-title-row"><div><h1>Audit Log</h1><p>Latest administrative and attendance actions.</p></div></div><section className="data-list">{rows.map(r=><article key={r.id}><div><strong>{r.action}</strong><small>{r.created_at} · {r.full_name||'System'}</small></div><span>{r.target_type}{r.target_id?` · ${r.target_id}`:''}</span></article>)}</section></>}
export function Settings(){
 const {profile}=useAuth(),admin=profile?.role==='SECTION_HEAD'
 const [s,setS]=useState<any>({attendance_threshold:'80',school_timezone:'Asia/Colombo',teacher_correction_allowed:'false'}),[msg,setMsg]=useState(''),[error,setError]=useState('')
 const [students,setStudents]=useState<any[]>([]),[search,setSearch]=useState(''),[deleting,setDeleting]=useState<string|null>(null),[teachers,setTeachers]=useState<any[]>([]),[teacherSearch,setTeacherSearch]=useState(''),[deletingTeacher,setDeletingTeacher]=useState<string|null>(null)

 async function loadStudents(){try{const x=await api<{students:any[]}>('/api/student-records');setStudents(x.students);setError('')}catch{setError('Could not load student records.')}}
 useEffect(()=>{if(admin){api<{settings:any}>('/api/settings').then(x=>setS(x.settings)).catch(()=>setError('Could not load system settings.'));api<{teachers:any[]}>('/api/teachers').then(x=>setTeachers(x.teachers)).catch(()=>setError('Could not load teachers.'))}loadStudents()},[admin])

 const filtered=useMemo(()=>students.filter(st=>`${st.full_name} ${st.admission_number} ${st.display_name}`.toLowerCase().includes(search.toLowerCase())),[students,search])

 async function deleteStudent(st:any){
  const typed=prompt(`Permanently delete ${st.full_name}?\n\nThis removes the student name, admission number, class history and all attendance records. This cannot be undone.\n\nType the admission number "${st.admission_number}" to confirm.`)
  if(typed===null)return
  if(typed.trim()!==String(st.admission_number)){setError('Admission number did not match. Student was not deleted.');return}
  setDeleting(st.id);setError('');setMsg('')
  try{
   await api(`/api/students/${encodeURIComponent(st.id)}`,{method:'DELETE'})
   setStudents(xs=>xs.filter(x=>x.id!==st.id))
   setMsg(`${st.full_name} was permanently deleted ✓`)
  }catch(e){
   const m=e instanceof Error?e.message:''
   setError(m==='forbidden'?'You do not have permission to delete this student.':'Could not permanently delete this student.')
  }finally{setDeleting(null)}
 }

 return <><div className="screen-title-row"><div><h1>Settings</h1><p>{admin?'System settings and permanent student record management.':'Student record management for your assigned classes.'}</p></div></div>

 {admin&&<section className="settings-form">
  <h3>Attendance Settings</h3>
  <label>Low attendance threshold (%)<input type="number" min="1" max="100" value={s.attendance_threshold||80} onChange={e=>setS({...s,attendance_threshold:e.target.value})}/></label>
  <label>School timezone<input value={s.school_timezone||''} onChange={e=>setS({...s,school_timezone:e.target.value})}/></label>
  <label className="toggle"><input type="checkbox" checked={s.teacher_correction_allowed==='true'} onChange={e=>setS({...s,teacher_correction_allowed:String(e.target.checked)})}/> Allow teachers to correct submitted attendance</label>
  <button className="primary" onClick={async()=>{try{await api('/api/settings',{method:'PUT',body:JSON.stringify(s)});setMsg('Settings saved ✓');setError('')}catch{setError('Could not save settings.')}}}>Save Settings</button>
 </section>}

 <section className="student-delete-settings">
  <div className="danger-heading"><AlertTriangle/><div><h3>Permanent Student Deletion</h3><p>Available here in Settings only. Deleting a student permanently removes their name, admission number, class history and attendance records.</p></div></div>
  <label className="search modern-search"><Search/><input placeholder="Search name, admission number or class…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  <div className="danger-note"><strong>Permanent action</strong><span>You must type the student's admission number before deletion is allowed.</span></div>
  <div className="student-delete-list">{filtered.map(st=><article key={st.id}>
   <div><strong>{st.full_name}</strong><small>{st.admission_number} · {st.display_name}{st.is_active?'':' · Inactive'}</small></div>
   <button className="permanent-delete" disabled={deleting===st.id} onClick={()=>deleteStudent(st)}><Trash2/>{deleting===st.id?'Deleting…':'Delete Permanently'}</button>
  </article>)}
  {!filtered.length&&<div className="empty-mini">No matching students.</div>}</div>
 </section>

 {admin&&<section className="student-delete-settings"><div className="danger-heading"><AlertTriangle/><div><h3>Permanent Teacher Deletion</h3><p>Section Head only. Permanently removes the teacher account, class assignments, sessions and teacher attendance records.</p></div></div><label className="search modern-search"><Search/><input placeholder="Search teacher name or username…" value={teacherSearch} onChange={e=>setTeacherSearch(e.target.value)}/></label><div className="danger-note"><strong>Permanent action</strong><span>You must type the teacher's username to confirm deletion.</span></div><div className="student-delete-list">{filteredTeachers.map(t=><article key={t.id}><div><strong>{t.full_name}</strong><small>@{t.username}{t.class_teacher_of?.display_name?` · Class Teacher ${t.class_teacher_of.display_name}`:''}</small></div><button className="permanent-delete" disabled={deletingTeacher===t.id} onClick={()=>deleteTeacher(t)}><Trash2/>{deletingTeacher===t.id?'Deleting…':'Delete Permanently'}</button></article>)}{!filteredTeachers.length&&<div className="empty-mini">No matching teachers.</div>}</div></section>}
 {error&&<div className="error">{error}</div>}{msg&&<div className="notice">{msg}</div>}
 </>}

export function IndividualAttendance(){
 const [classes,setClasses]=useState<SchoolClass[]>([]),[rows,setRows]=useState<any[]>([]),[search,setSearch]=useState(''),[grade,setGrade]=useState('ALL'),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(async x=>{setClasses(x.classes);try{const all=(await Promise.all(x.classes.map(c=>api<{report:any[]}>(`/api/reports?class_id=${encodeURIComponent(c.id)}`).then(r=>r.report.map(s=>({...s,class_id:c.id}))))).flat();setRows(all);setError('')}catch{setError('Could not load individual attendance.')}finally{setLoading(false)}}).catch(()=>{setError('Could not load classes.');setLoading(false)})},[])
 const grades=Array.from(new Set(classes.map(c=>String(c.display_name).split('-')[0].trim()))).sort()
 const filtered=rows.filter(r=>(grade==='ALL'||String(r.display_name).startsWith(grade+'-'))&&(!search.trim()||`${r.full_name} ${r.admission_number}`.toLowerCase().includes(search.trim().toLowerCase()))).sort((a,b)=>String(a.display_name).localeCompare(String(b.display_name))||String(a.admission_number).localeCompare(String(b.admission_number),undefined,{numeric:true}))
 return <><div className="screen-title-row"><div><h1>Individual Attendance</h1><p>Attendance count for each student.</p></div></div>
 <div className="filters"><label className="search modern-search"><Search/><input placeholder="Search name or admission number…" value={search} onChange={e=>setSearch(e.target.value)}/></label><select value={grade} onChange={e=>setGrade(e.target.value)}><option value="ALL">All Grades</option>{grades.map(g=><option key={g} value={g}>Grade {g}</option>)}</select></div>
 {loading&&<div className="loading">Loading attendance…</div>}{error&&<div className="error">{error}</div>}
 <section className="report-list">{filtered.map(r=><article key={r.student_id}><div><small>{r.admission_number} · {r.display_name}</small><strong>{r.full_name}</strong></div><span className="green"><strong>{Number(r.present||0)}</strong> attended</span><span className="red"><strong>{Number(r.absent||0)}</strong> absent</span><strong>{Number(r.present||0)}/{Number(r.total||0)} days</strong></article>)}</section>
 {!loading&&!error&&!filtered.length&&<div className="empty-card">No matching students.</div>}</>
}
