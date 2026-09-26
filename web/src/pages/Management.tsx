import {useEffect,useMemo,useState,type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import {CalendarClock,ChevronDown,KeyRound,Pencil,Save,Search,UserRound,X} from 'lucide-react'
import {api} from '../lib/api'
import type {SchoolClass,Student} from '../types'
type S=Student&{display_name:string}
type T={id:string;full_name:string;username:string;is_active:number;classes:SchoolClass[];class_teacher_of?:SchoolClass|null}
type Period={period_no:number;subject:string;teacher_id:string}

export function Students(){
 const [students,setStudents]=useState<S[]>([]),[classes,setClasses]=useState<SchoolClass[]>([]),[search,setSearch]=useState(''),[form,setForm]=useState({admission_number:'',full_name:'',class_id:''}),[error,setError]=useState(''),[msg,setMsg]=useState(''),[expandedClass,setExpandedClass]=useState<string|null>(null),[bulkOpen,setBulkOpen]=useState(false),[bulkClass,setBulkClass]=useState(''),[bulkText,setBulkText]=useState(''),[bulkBusy,setBulkBusy]=useState(false)
 async function load(){
  try{
   const [s,c]=await Promise.all([api<{students:S[]}>('/api/students'),api<{classes:SchoolClass[]}>('/api/classes')])
   setStudents(s.students);setClasses(c.classes);setForm(x=>({...x,class_id:x.class_id||c.classes[0]?.id||''}));setBulkClass(x=>x||c.classes[0]?.id||'');setExpandedClass(x=>x??c.classes[0]?.id??null);setError('')
  }catch{setError('Could not load students.')}
 }
 useEffect(()=>{load()},[])

 const grouped=useMemo(()=>classes.map(c=>{
  const list=students
   .filter(s=>s.class_id===c.id)
   .filter(s=>!search.trim()||`${s.full_name} ${s.admission_number}`.toLowerCase().includes(search.trim().toLowerCase()))
   .sort((a,b)=>String(a.admission_number).localeCompare(String(b.admission_number),undefined,{numeric:true,sensitivity:'base'}))
  return{cls:c,students:list,total:students.filter(s=>s.class_id===c.id).length}
 }).filter(g=>!search.trim()||g.students.length>0),[classes,students,search])

 async function add(e:FormEvent){
  e.preventDefault();setError('')
  try{
   await api('/api/students',{method:'POST',body:JSON.stringify(form)})
   setForm(x=>({...x,admission_number:'',full_name:''}));await load()
  }catch(e){setError(e instanceof Error&&e.message==='admission_number_exists'?'Admission number already exists.':'Could not add student.')}
 }

 async function bulkImport(){
  const lines=bulkText.split(/\r?\n/).map(x=>x.trim()).filter(Boolean), parsed=lines.map(line=>{const m=line.match(/^(\S+)\s+(.+)$/);return m?{admission_number:m[1],full_name:m[2].trim()}:null})
  if(!bulkClass){setError('Select a class.');return}if(!lines.length||parsed.some(x=>!x)){setError('Each line must start with admission number followed by student name.');return}
  setBulkBusy(true);setError('');setMsg('');let added=0,duplicates=0,failed=0
  for(const s of parsed){try{await api('/api/students',{method:'POST',body:JSON.stringify({...s,class_id:bulkClass})});added++}catch(e){if(e instanceof Error&&e.message==='admission_number_exists')duplicates++;else failed++}}
  setBulkBusy(false);await load();setMsg(`Bulk import complete: ${added} added${duplicates?`, ${duplicates} duplicate(s) skipped`:''}${failed?`, ${failed} failed`:''}.`);if(!failed){setBulkText('');setBulkOpen(false)}
 }

 return <>
  <div className="screen-title-row"><div><h1>Classes & Students</h1><p>Students are separated by class and ordered by admission number.</p></div></div>

  <label className="search modern-search"><Search/><input placeholder="Search student name or admission number…" value={search} onChange={e=>setSearch(e.target.value)}/></label>

  <form className="inline-form" onSubmit={add}>
   <input required placeholder="Admission number" value={form.admission_number} onChange={e=>setForm({...form,admission_number:e.target.value})}/>
   <input required placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/>
   <select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select>
   <button className="primary">Add Student</button>
  </form>

  <button type="button" className="secondary" onClick={()=>setBulkOpen(x=>!x)}>{bulkOpen?'Close Bulk Import':'Bulk Import Students'}</button>
  {bulkOpen&&<section className="settings-form"><h3>Bulk Import Students</h3><p>One student per line: admission number followed by full name.</p><select value={bulkClass} onChange={e=>setBulkClass(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select><textarea rows={10} placeholder={"13310 F M Muaadh\n13323 M N Akmal"} value={bulkText} onChange={e=>setBulkText(e.target.value)}/><button type="button" className="primary" disabled={bulkBusy} onClick={bulkImport}>{bulkBusy?'Importing…':'Import Students'}</button></section>}
  {error&&<div className="error">{error}</div>}
  {msg&&<div className="notice">{msg}</div>}

  <section className="class-student-groups">
   {grouped.map(({cls,students:list,total})=><section className="class-student-card" key={cls.id}>
    <header className="expandable-class-header" role="button" tabIndex={0} onClick={()=>setExpandedClass(x=>x===cls.id?null:cls.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setExpandedClass(x=>x===cls.id?null:cls.id)}}}><div><strong>{cls.display_name}</strong><small>{total} student{total===1?'':'s'}</small></div><div className="class-header-actions"><span>Admission order</span><ChevronDown className={expandedClass===cls.id?'rotated':''}/></div></header>
    {expandedClass===cls.id&&<><div className="class-student-head simple-student-head"><span>#</span><span>Admission No.</span><span>Student Name</span></div>
    <div className="class-student-body">
     {list.map((s,i)=><article key={s.id}>
      <span className="student-index">{i+1}</span>
      <strong className="student-admission">{s.admission_number}</strong>
      <div className="student-main-name"><strong>{s.full_name}</strong></div>
     </article>)}
     {!list.length&&<div className="class-empty-students">{search?'No matching students in this class.':'No students added to this class yet.'}</div>}
    </div></>}
   </section>)}
   {!grouped.length&&<div className="empty-card">No students match your search.</div>}
  </section>
 </>}

export function Teachers(){
 const [rows,setRows]=useState<T[]>([]),[classes,setClasses]=useState<SchoolClass[]>([]),[error,setError]=useState(''),[msg,setMsg]=useState('')
 const [form,setForm]=useState({full_name:'',username:'',password:'',class_ids:[] as string[],class_teacher_id:''})
 const [editId,setEditId]=useState<string|null>(null)
 const [editForm,setEditForm]=useState({full_name:'',username:'',password:'',class_ids:[] as string[],class_teacher_id:'',is_active:true})

 async function load(){
  try{
   const [t,c]=await Promise.all([api<{teachers:T[]}>('/api/teachers'),api<{classes:SchoolClass[]}>('/api/classes')])
   setRows(t.teachers);setClasses(c.classes);setError('')
  }catch{setError('Could not load teachers.')}
 }
 useEffect(()=>{load()},[])

 function withClassTeacherAccess(ids:string[],classTeacherId:string){
  return classTeacherId&&!ids.includes(classTeacherId)?[...ids,classTeacherId]:ids
 }

 async function add(e:FormEvent){
  e.preventDefault();setError('');setMsg('')
  try{
   const payload={...form,class_ids:withClassTeacherAccess(form.class_ids,form.class_teacher_id)}
   await api('/api/teachers',{method:'POST',body:JSON.stringify(payload)})
   setForm({full_name:'',username:'',password:'',class_ids:[],class_teacher_id:''})
   setMsg('Teacher created ✓');await load()
  }catch(e){setError(e instanceof Error&&e.message==='username_exists'?'Username already exists.':'Could not create teacher. Password must be at least 10 characters.')}
 }

 function beginEdit(t:T){
  setEditId(t.id);setMsg('');setError('')
  setEditForm({
   full_name:t.full_name,
   username:t.username,
   password:'',
   class_ids:t.classes.map(c=>c.id),
   class_teacher_id:t.class_teacher_of?.id||'',
   is_active:!!t.is_active
  })
 }

 function setEditClassTeacher(classId:string){
  setEditForm(x=>({...x,class_teacher_id:classId,class_ids:withClassTeacherAccess(x.class_ids,classId)}))
 }

 async function saveEdit(e:FormEvent){
  e.preventDefault()
  if(!editId)return
  setError('');setMsg('')
  try{
   const payload:any={
    full_name:editForm.full_name.trim(),
    is_active:editForm.is_active,
    class_ids:withClassTeacherAccess(editForm.class_ids,editForm.class_teacher_id),
    class_teacher_id:editForm.class_teacher_id
   }
   if(editForm.password.trim())payload.password=editForm.password
   await api(`/api/teachers/${editId}`,{method:'PUT',body:JSON.stringify(payload)})
   setMsg('Teacher updated ✓');setEditId(null);await load()
  }catch(e){setError(e instanceof Error&&e.message==='password_min_10'?'New password must be at least 10 characters.':'Could not update teacher.')}
 }

 return <>
  <div className="screen-title-row"><div><h1>Teachers Management</h1><p>Edit teacher details, class access and class-teacher assignments.</p></div><Link className="secondary icon-button" to="/timetable"><CalendarClock size={17}/> Timetable</Link></div>

  <form className="teacher-form" onSubmit={add}>
   <h3>Add Teacher</h3>
   <input required placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/>
   <input required placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/>
   <input required minLength={10} type="password" placeholder="Temporary password (10+ characters)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
   <label>Class teacher of
    <select value={form.class_teacher_id} onChange={e=>{const v=e.target.value;setForm(x=>({...x,class_teacher_id:v,class_ids:withClassTeacherAccess(x.class_ids,v)}))}}>
     <option value="">Not a class teacher</option>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}
    </select>
   </label>
   <div><small className="field-caption">Classes this teacher can access</small><div className="check-grid">{classes.map(c=><label key={c.id}><input type="checkbox" checked={form.class_ids.includes(c.id)} onChange={e=>setForm({...form,class_ids:e.target.checked?[...form.class_ids,c.id]:form.class_ids.filter(x=>x!==c.id)})}/>{c.display_name}</label>)}</div></div>
   <button className="primary">+ Add Teacher</button>
  </form>

  {error&&<div className="error">{error}</div>}{msg&&<div className="notice">{msg}</div>}

  <section className="teacher-list">{rows.map(t=><div className="teacher-management-item" key={t.id}>
   <article>
    <span className="teacher-avatar"><UserRound/></span>
    <div><strong>{t.full_name}</strong><small>@{t.username}</small><small>{t.class_teacher_of?`Class Teacher · ${t.class_teacher_of.display_name}`:'Not assigned as class teacher'}</small><small>Access: {t.classes.length?t.classes.map(c=>c.display_name).join(', '):'No classes'}</small></div>
    <span className={t.is_active?'status-pill active':'status-pill waiting'}>{t.is_active?'Active':'Disabled'}</span>
    <button className="teacher-edit-button" type="button" onClick={()=>editId===t.id?setEditId(null):beginEdit(t)}>{editId===t.id?<X/>:<Pencil/>}<span>{editId===t.id?'Close':'Edit'}</span></button>
   </article>

   {editId===t.id&&<form className="teacher-edit-card" onSubmit={saveEdit}>
    <div className="teacher-edit-title"><div><Pencil/><strong>Edit {t.full_name}</strong></div><small>Username cannot be changed.</small></div>
    <div className="teacher-edit-grid">
     <label>Full name<input required value={editForm.full_name} onChange={e=>setEditForm({...editForm,full_name:e.target.value})}/></label>
     <label>Username<input value={editForm.username} disabled readOnly/></label>
     <label>Class teacher of<select value={editForm.class_teacher_id} onChange={e=>setEditClassTeacher(e.target.value)}><option value="">Not a class teacher</option>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></label>
     <label>Account status<select value={editForm.is_active?'active':'disabled'} onChange={e=>setEditForm({...editForm,is_active:e.target.value==='active'})}><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
    </div>

    <div className="teacher-access-editor"><strong>Assigned / accessible classes</strong><small>The class-teacher class is automatically kept accessible.</small><div className="check-grid">{classes.map(c=><label key={c.id}><input type="checkbox" checked={editForm.class_ids.includes(c.id)} disabled={editForm.class_teacher_id===c.id} onChange={e=>setEditForm({...editForm,class_ids:e.target.checked?[...editForm.class_ids,c.id]:editForm.class_ids.filter(x=>x!==c.id)})}/>{c.display_name}{editForm.class_teacher_id===c.id?' ★':''}</label>)}</div></div>

    <label className="password-reset-field"><span><KeyRound/> Reset password <small>(optional)</small></span><input type="password" minLength={10} placeholder="Leave blank to keep current password" value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})}/></label>

    <div className="teacher-edit-actions"><button className="secondary" type="button" onClick={()=>setEditId(null)}><X size={16}/> Cancel</button><button className="primary" type="submit"><Save size={16}/> Save Teacher</button></div>
   </form>}
  </div>)}</section>
 </>}

export function Timetable(){const [classes,setClasses]=useState<SchoolClass[]>([]),[teachers,setTeachers]=useState<T[]>([]),[classId,setClassId]=useState(''),[periods,setPeriods]=useState<Period[]>(Array.from({length:9},(_,i)=>({period_no:i+1,subject:'',teacher_id:''}))),[msg,setMsg]=useState('')
 useEffect(()=>{Promise.all([api<{classes:SchoolClass[]}>('/api/classes'),api<{teachers:T[]}>('/api/teachers')]).then(([c,t])=>{setClasses(c.classes);setTeachers(t.teachers);setClassId(c.classes[0]?.id||'')})},[])
 useEffect(()=>{if(!classId)return;api<{periods:any[]}>(`/api/timetable?class_id=${classId}`).then(x=>{const by=new Map(x.periods.map(p=>[Number(p.period_no),p]));setPeriods(Array.from({length:9},(_,i)=>{const p:any=by.get(i+1);return{period_no:i+1,subject:p?.subject||'',teacher_id:p?.teacher_id||''}}))}).catch(()=>setMsg('Deploy the latest Worker and database migration to configure timetables.'))},[classId])
 function patch(n:number,k:'subject'|'teacher_id',v:string){setPeriods(ps=>ps.map(p=>p.period_no===n?{...p,[k]:v}:p))}
 async function save(){const active=periods.filter(p=>p.subject.trim());try{await api('/api/timetable',{method:'PUT',body:JSON.stringify({class_id:classId,periods:active})});setMsg('Timetable saved ✓')}catch{setMsg('Could not save timetable. Deploy the latest backend first.')}}
 return <><div className="screen-title-row"><div><h1>Timetable / Period Setup</h1><p>Configure Periods 1–9, subjects and teachers.</p></div><select value={classId} onChange={e=>setClassId(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></div><section className="timetable-card"><div className="timetable-head"><span>Period</span><span>Subject</span><span>Teacher</span></div>{periods.map(p=><div className="timetable-row" key={p.period_no}><strong>{p.period_no}</strong><input placeholder="Subject" value={p.subject} onChange={e=>patch(p.period_no,'subject',e.target.value)}/><select value={p.teacher_id} onChange={e=>patch(p.period_no,'teacher_id',e.target.value)}><option value="">Select teacher</option>{teachers.filter(t=>t.is_active).map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div>)}</section>{msg&&<div className={msg.includes('✓')?'notice':'error'}>{msg}</div>}<button className="submit" onClick={save}>Save Timetable</button></>}

export function Placeholder({title,description}:{title:string;description:string}){return <><div className="screen-title-row"><div><h1>{title}</h1><p>{description}</p></div></div></>}