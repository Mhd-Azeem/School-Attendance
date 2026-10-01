import {useEffect,useState} from 'react'
import {MessageSquare,Save,X} from 'lucide-react'
import {api} from '../lib/api'

type StudentLike={id:string;full_name:string;admission_number:string}
type NoteRow={id:string;note:string;created_at:string;created_by_name:string;created_by_role:string}

function noteTime(value:string){
 const d=new Date(value.endsWith('Z')?value:value+'Z')
 return Number.isNaN(d.getTime())?value:d.toLocaleString()
}

export function StudentNotesButton({student}:{student:StudentLike}){
 const [open,setOpen]=useState(false)
 const [notes,setNotes]=useState<NoteRow[]>([])
 const [text,setText]=useState('')
 const [loading,setLoading]=useState(false)
 const [saving,setSaving]=useState(false)
 const [error,setError]=useState('')

 async function load(){
  setLoading(true);setError('')
  try{
   const x=await api<{notes:NoteRow[]}>(`/api/students/${encodeURIComponent(student.id)}/notes`)
   setNotes(x.notes)
  }catch(e){const m=e instanceof Error?e.message:'';setError((m==='request_failed_404'||m==='not_found')?'Student Notes is not available on the live backend yet. Deploy the latest backend once to enable shared notes.':m==='forbidden'?'You do not have access to this student’s notes.':'Could not load this student’s notes.')}
  finally{setLoading(false)}
 }

 useEffect(()=>{if(open)void load()},[open,student.id])

 async function save(){
  const note=text.trim()
  if(!note||saving)return
  setSaving(true);setError('')
  try{
   const x=await api<{note:NoteRow}>(`/api/students/${encodeURIComponent(student.id)}/notes`,{method:'POST',body:JSON.stringify({note}),silentSuccess:true})
   setNotes(rows=>[x.note,...rows]);setText('')
  }catch(e){const m=e instanceof Error?e.message:'';setError(m==='note_too_long'?'Keep the note within 1,000 characters.':(m==='request_failed_404'||m==='not_found')?'Student Notes is not available on the live backend yet. Deploy the latest backend once, then notes will save across devices.':m==='forbidden'?'You do not have permission to add a note for this student.':'Could not save the note.')}
  finally{setSaving(false)}
 }

 return <>
  <button type="button" className="student-note-button" onClick={()=>setOpen(true)}><MessageSquare size={15}/> Notes</button>
  {open&&<div className="student-notes-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <section className="student-notes-modal" role="dialog" aria-modal="true" aria-labelledby="student-notes-title">
    <header>
     <div><strong id="student-notes-title">{student.full_name}</strong><small>{student.admission_number} · Student Notes</small></div>
     <button type="button" className="student-notes-close" onClick={()=>setOpen(false)} aria-label="Close notes"><X/></button>
    </header>
    <div className="student-note-editor">
     <label htmlFor={`student-note-${student.id}`}>Add a note</label>
     <textarea id={`student-note-${student.id}`} rows={4} maxLength={1000} value={text} onChange={e=>setText(e.target.value)} placeholder="Example: Left school at 12:00 PM because of illness."/>
     <div><small>{text.length}/1000</small><button type="button" className="primary student-note-save" onClick={save} disabled={saving||!text.trim()}><Save size={15}/>{saving?'Saving…':'Save Note'}</button></div>
    </div>
    {error&&<div className="error">{error}</div>}
    <div className="student-note-history">
     <h3>Note History</h3>
     {loading?<div className="empty-mini">Loading notes…</div>:notes.length?<ul>{notes.map(n=><li key={n.id}><p>{n.note}</p><small>{n.created_by_name} · {n.created_by_role==='SECTION_HEAD'?'Section Head':'Teacher'} · {noteTime(n.created_at)}</small></li>)}</ul>:<div className="empty-mini">No notes have been added for this student yet.</div>}
    </div>
   </section>
  </div>}
 </>
}
