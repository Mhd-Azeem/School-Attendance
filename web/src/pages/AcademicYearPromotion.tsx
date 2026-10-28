import {useEffect,useMemo,useState} from 'react'
import {ArrowLeft,ArrowRight,CalendarDays,CheckCircle2,ChevronRight,GraduationCap,RefreshCw,Users} from 'lucide-react'
import {Link,useNavigate} from 'react-router-dom'
import {api} from '../lib/api'

type StudentDecision={student_id:string;admission_number:string;full_name:string;outcome:'PROMOTE'|'REPEAT'|'LEFT'}
type ClassPlan={
 id:string;display_name:string;grade_name:string;student_count:number;
 class_teacher?:{id:string;full_name:string}|null;
 students:Array<{id:string;admission_number:string;full_name:string;class_id:string}>
}
type Teacher={id:string;full_name:string;username:string}
type PlanResponse={current:{id:string;name:string};suggested_year:string;classes:ClassPlan[];teachers:Teacher[]}
type Mapping={from_class_id:string;to_class_id:string;teacher_id:string;students:StudentDecision[]}

function nextClassId(classes:ClassPlan[],source:ClassPlan){
 const grade=Number(source.grade_name)
 if(!Number.isFinite(grade))return ''
 const targetGrade=String(grade+1)
 return classes.find(c=>String(c.grade_name)===targetGrade&&String(c.display_name).split('-').slice(1).join('-')===String(source.display_name).split('-').slice(1).join('-'))?.id||''
}

export function AcademicYearPromotion(){
 const nav=useNavigate()
 const [data,setData]=useState<PlanResponse|null>(null),[mappings,setMappings]=useState<Mapping[]>([]),[targetYear,setTargetYear]=useState(''),[step,setStep]=useState(0),[editClass,setEditClass]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<any>(null)

 useEffect(()=>{api<PlanResponse>('/api/promotion/plan').then(x=>{
  setData(x);setTargetYear(x.suggested_year)
  setMappings(x.classes.map(cls=>({
   from_class_id:cls.id,
   to_class_id:nextClassId(x.classes,cls),
   teacher_id:'',
   students:cls.students.map(s=>({student_id:s.id,admission_number:s.admission_number,full_name:s.full_name,outcome:nextClassId(x.classes,cls)?'PROMOTE':'REPEAT'}))
  })))
 }).catch(()=>setError('Could not load academic-year promotion data.'))},[])

 const classById=useMemo(()=>Object.fromEntries((data?.classes||[]).map(c=>[c.id,c])),[data])
 const mappingById=useMemo(()=>Object.fromEntries(mappings.map(m=>[m.from_class_id,m])),[mappings])
 const counts=useMemo(()=>mappings.reduce((a,m)=>{for(const s of m.students)a[s.outcome]++;return a},{PROMOTE:0,REPEAT:0,LEFT:0} as Record<'PROMOTE'|'REPEAT'|'LEFT',number>),[mappings])
 const mappedClasses=useMemo(()=>mappings.filter(m=>m.to_class_id).length,[mappings])

 function updateMapping(id:string,patch:Partial<Mapping>){setMappings(xs=>xs.map(m=>m.from_class_id===id?{...m,...patch}:m))}
 function setDecision(classId:string,studentId:string,outcome:StudentDecision['outcome']){
  setMappings(xs=>xs.map(m=>m.from_class_id===classId?{...m,students:m.students.map(s=>s.student_id===studentId?{...s,outcome}:s)}:m))
 }
 function setAll(classId:string,outcome:StudentDecision['outcome']){setMappings(xs=>xs.map(m=>m.from_class_id===classId?{...m,students:m.students.map(s=>({...s,outcome}))}:m))}
 function validation(){
  if(!/^\d{4}$/.test(targetYear))return 'Enter a valid 4-digit academic year.'
  if(data&&targetYear===String(data.current.name))return 'The new academic year must be different from the current year.'
  for(const m of mappings){
   if(m.students.some(s=>s.outcome==='PROMOTE')&&!m.to_class_id)return `${classById[m.from_class_id]?.display_name||'A class'} has students marked Promote but no destination class selected.`
  }
  return ''
 }
 async function confirmPromotion(){
  const v=validation();if(v){setError(v);return}
  if(!confirm(`Confirm year-end promotion from ${data?.current.name} to ${targetYear}? This will update current student classes and teacher assignments.`))return
  setBusy(true);setError('')
  try{
   const x=await api<any>('/api/promotion/execute',{method:'POST',body:JSON.stringify({target_year:targetYear,mappings:mappings.map(m=>({from_class_id:m.from_class_id,to_class_id:m.to_class_id||null,teacher_id:m.teacher_id||null,students:m.students.map(s=>({student_id:s.student_id,outcome:s.outcome}))}))})})
   setResult(x);setStep(4);window.dispatchEvent(new CustomEvent('academic-year-changed',{detail:{year:targetYear}}))
  }catch(e:any){
   const code=e?.message||''
   setError(code==='all_active_students_require_a_decision'?'Every active student must have a promotion decision.':code==='promotion_already_completed'?'This academic-year promotion has already been completed.':'Could not complete the promotion. No changes were applied.')
  }finally{setBusy(false)}
 }

 if(error&&!data)return <><div className="screen-title-row"><div><h1>Academic Year & Promotion</h1><p>Year-end student and teacher transition.</p></div></div><div className="error">{error}</div></>
 if(!data)return <div className="loading">Loading promotion workspace…</div>

 const activeEdit=editClass?classById[editClass]:null
 const activeMap=editClass?mappingById[editClass]:null

 if(step===4&&result)return <>
  <div className="screen-title-row"><div><h1>Academic Year & Promotion</h1><p>Year-end transition completed.</p></div></div>
  <section className="promotion-complete-card">
   <CheckCircle2/>
   <div><strong>Year-End Promotion Completed!</strong><p>Academic year has been changed to {result.to_year}. Student classes and selected teacher assignments are now updated.</p></div>
  </section>
  <section className="academic-current-card">
   <div><CalendarDays/><span><small>Current Academic Year</small><strong>{result.to_year}</strong></span></div>
   <button className="secondary" onClick={()=>nav('/')}>Go to Dashboard</button>
  </section>
  <div className="promotion-stat-grid">
   <article><strong>{result.promoted}</strong><small>Promoted</small></article>
   <article><strong>{result.repeated}</strong><small>Repeating</small></article>
   <article><strong>{result.left}</strong><small>Graduated / Left</small></article>
  </div>
 </>

 if(activeEdit&&activeMap)return <>
  <div className="screen-title-row"><div><h1>Edit Students — {activeEdit.display_name}</h1><p>{activeEdit.student_count} active students</p></div><button className="secondary" onClick={()=>setEditClass(null)}><ArrowLeft size={16}/> Back</button></div>
  <div className="promotion-student-actions">
   <button onClick={()=>setAll(activeEdit.id,'PROMOTE')} className="primary">Promote All</button>
   <button onClick={()=>setAll(activeEdit.id,'REPEAT')} className="secondary">Repeat All</button>
   <button onClick={()=>setAll(activeEdit.id,'LEFT')} className="secondary danger-soft">Graduated / Left All</button>
  </div>
  <section className="promotion-student-table">
   <div className="promotion-student-head"><span>#</span><span>Admission</span><span>Student</span><span>New Status ({targetYear})</span></div>
   {activeMap.students.map((s,i)=><article key={s.student_id} className={s.outcome==='LEFT'?'left':s.outcome==='REPEAT'?'repeat':''}>
    <span>{i+1}</span><strong>{s.admission_number}</strong><div>{s.full_name}</div>
    <select value={s.outcome} onChange={e=>setDecision(activeEdit.id,s.student_id,e.target.value as StudentDecision['outcome'])}>
     <option value="PROMOTE">Promote to {activeMap.to_class_id?classById[activeMap.to_class_id]?.display_name:'selected class'}</option>
     <option value="REPEAT">Repeat {activeEdit.display_name}</option>
     <option value="LEFT">Graduated / Left</option>
    </select>
   </article>)}
  </section>
  <div className="promotion-footer"><small>{activeMap.students.filter(s=>s.outcome==='PROMOTE').length} promote · {activeMap.students.filter(s=>s.outcome==='REPEAT').length} repeat · {activeMap.students.filter(s=>s.outcome==='LEFT').length} graduated/left</small><button className="primary" onClick={()=>setEditClass(null)}>Save & Back to Classes</button></div>
 </>

 return <>
  <div className="screen-title-row"><div><h1>Academic Year & Promotion</h1><p>Move students and teacher assignments safely into the next academic year.</p></div>{step>0&&<button className="secondary" onClick={()=>setStep(x=>Math.max(0,x-1))}><ArrowLeft size={16}/> Back</button>}</div>

  {step===0&&<>
   <section className="academic-current-card">
    <div><CalendarDays/><span><small>Current Academic Year</small><strong>{data.current.name}</strong></span></div>
    <button className="primary" onClick={()=>setStep(1)}>Start Year-End Promotion <ArrowRight size={17}/></button>
   </section>
   <section className="promotion-info-card"><GraduationCap/><div><strong>What this process does</strong><p>Promotes students, keeps repeaters in place, marks leavers inactive, reassigns class teachers, and preserves all historical attendance.</p></div></section>
   <Link to="/settings" className="secondary promotion-settings-link">Manage Grades & Classes first</Link>
  </>}

  {step===1&&<>
   <div className="promotion-steps"><span className="active">1 Map Classes</span><span>2 Students</span><span>3 Preview</span><span>4 Confirm</span></div>
   <section className="settings-form promotion-year-field"><label>New academic year<input value={targetYear} onChange={e=>setTargetYear(e.target.value.replace(/\D/g,'').slice(0,4))}/></label><p>Destination classes must already exist. Add missing grades/classes from Settings before confirming.</p></section>
   <section className="promotion-map-table">
    <div className="promotion-map-head"><span>Current Class ({data.current.name})</span><span>Move to ({targetYear||'Next'})</span><span>New Class Teacher</span><span>Students</span><span>Action</span></div>
    {data.classes.map(cls=>{const m=mappingById[cls.id];return <article key={cls.id}>
     <strong>{cls.display_name}</strong>
     <select value={m?.to_class_id||''} onChange={e=>updateMapping(cls.id,{to_class_id:e.target.value})}><option value="">No destination</option>{data.classes.filter(c=>c.id!==cls.id).map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select>
     <select value={m?.teacher_id||''} onChange={e=>updateMapping(cls.id,{teacher_id:e.target.value})}><option value="">No new class teacher</option>{data.teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select>
     <span>{cls.student_count}</span>
     <button className="secondary" onClick={()=>setEditClass(cls.id)}>Edit Students</button>
    </article>})}
   </section>
   {error&&<div className="error">{error}</div>}
   <div className="promotion-footer"><span>{mappedClasses}/{data.classes.length} classes mapped</span><button className="primary" onClick={()=>{const v=validation();if(v){setError(v);return}setError('');setStep(2)}}>Next: Review Students <ArrowRight size={16}/></button></div>
  </>}

  {step===2&&<>
   <div className="promotion-steps"><span>1 Map Classes</span><span className="active">2 Students</span><span>3 Preview</span><span>4 Confirm</span></div>
   <div className="promotion-stat-grid">
    <article><strong>{counts.PROMOTE}</strong><small>Students to Promote</small></article>
    <article><strong>{counts.REPEAT}</strong><small>Repeating</small></article>
    <article><strong>{counts.LEFT}</strong><small>Graduated / Left</small></article>
   </div>
   <section className="promotion-review-classes">{data.classes.map(cls=>{const m=mappingById[cls.id];return <article key={cls.id}><div><strong>{cls.display_name}</strong><small>→ {m?.to_class_id?classById[m.to_class_id]?.display_name:'No destination'} · {cls.student_count} students</small></div><button className="secondary" onClick={()=>setEditClass(cls.id)}>Edit Students <ChevronRight size={15}/></button></article>})}</section>
   <div className="promotion-footer"><span>Review individual exceptions before continuing.</span><button className="primary" onClick={()=>setStep(3)}>Preview Changes <ArrowRight size={16}/></button></div>
  </>}

  {step===3&&<>
   <div className="promotion-steps"><span>1 Map Classes</span><span>2 Students</span><span className="active">3 Preview</span><span>4 Confirm</span></div>
   <div className="promotion-warning">Review carefully. Confirming changes the active academic year and current student/teacher assignments, while preserving historical attendance.</div>
   <div className="promotion-stat-grid">
    <article><strong>{counts.PROMOTE}</strong><small>Students to Promote</small></article>
    <article><strong>{data.classes.length}</strong><small>Classes Affected</small></article>
    <article><strong>{mappings.filter(m=>m.teacher_id).length}</strong><small>Teacher Assignments</small></article>
    <article><strong>{counts.REPEAT}</strong><small>Repeating</small></article>
    <article><strong>{counts.LEFT}</strong><small>Graduated / Left</small></article>
   </div>
   <section className="promotion-preview-table">
    <div className="promotion-preview-head"><span>Current Class</span><span>Move to</span><span>Students</span><span>New Class Teacher</span></div>
    {data.classes.map(cls=>{const m=mappingById[cls.id];const teacher=data.teachers.find(t=>t.id===m?.teacher_id);return <article key={cls.id}><strong>{cls.display_name}</strong><span>{m?.to_class_id?classById[m.to_class_id]?.display_name:'—'}</span><span>{m?.students.length} ({m?.students.filter(s=>s.outcome==='PROMOTE').length} / {m?.students.filter(s=>s.outcome==='REPEAT').length} / {m?.students.filter(s=>s.outcome==='LEFT').length})</span><span>{teacher?.full_name||'—'}</span></article>})}
   </section>
   {error&&<div className="error">{error}</div>}
   <div className="promotion-footer"><button className="secondary" onClick={()=>setStep(2)}><ArrowLeft size={16}/> Back</button><button className="primary promotion-confirm" disabled={busy} onClick={confirmPromotion}>{busy?<><RefreshCw className="spin"/> Confirming…</>:<>Confirm Promotion <CheckCircle2 size={17}/></>}</button></div>
  </>}
 </>
}
