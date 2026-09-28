import {useEffect,useMemo,useRef,useState} from 'react'
import {api} from '../lib/api'
import type {SchoolClass} from '../types'
import {useAuth} from '../AuthContext'
import {Link} from 'react-router-dom'
import {AlertTriangle,ChevronDown,Search,Trash2} from 'lucide-react'
export function History(){
 const [mode,setMode]=useState<'student'|'period'>('student'),[classes,setClasses]=useState<SchoolClass[]>([]),[classId,setClassId]=useState(''),[rows,setRows]=useState<any[]>([]),[expanded,setExpanded]=useState<string|null>(null),[studentDetails,setStudentDetails]=useState<Record<string,any[]>>({}),[loadingDetail,setLoadingDetail]=useState<string|null>(null)
 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(x=>{setClasses(x.classes);setClassId(x.classes[0]?.id||'')})},[])
 useEffect(()=>{setExpanded(null);if(!classId)return;if(mode==='student')api<{sessions:any[]}>(`/api/history?class_id=${classId}`).then(x=>setRows(x.sessions)).catch(()=>setRows([]));else api<{history:any[]}>(`/api/period-history?class_id=${classId}`).then(x=>setRows(x.history)).catch(()=>setRows([]))},[classId,mode])
 const ordinal=(n:any)=>{const x=Number(n);return x===1?'1st':x===2?'2nd':x===3?'3rd':`${x}th`}
 const statusLabel=(v:any)=>String(v||'').replaceAll('_',' ').replace('NOT ARRIVED RELIEF','NO TEACHER PRESENTED')
 async function toggleRow(r:any,i:number){
  const key=String(r.session_id||r.attendance_date||i)
  if(expanded===key){setExpanded(null);return}
  setExpanded(key)
  if(mode==='student'&&r.session_id&&!studentDetails[key]){
   setLoadingDetail(key)
   try{const x=await api<{records:any[]}>(`/api/attendance/${encodeURIComponent(r.session_id)}`);setStudentDetails(v=>({...v,[key]:x.records}))}
   catch{setStudentDetails(v=>({...v,[key]:[]}))}
   finally{setLoadingDetail(null)}
  }
 }
 return <><div className="screen-title-row"><div><h1>Teacher History</h1><p>Review previously submitted registers.</p></div><select value={classId} onChange={e=>setClassId(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></div><div className="segmented"><button className={mode==='student'?'active':''} onClick={()=>setMode('student')}>Student</button><button className={mode==='period'?'active':''} onClick={()=>setMode('period')}>Teacher Period</button></div><section className="history-list expandable-history">{rows.map((r,i)=>{
  const key=String(r.session_id||r.attendance_date||i),open=expanded===key
  return <article key={key} className={open?'history-entry expanded':'history-entry'}>
   <button type="button" className="history-summary-row" onClick={()=>toggleRow(r,i)}>
    <div><strong>{r.attendance_date}</strong><small>{r.display_name}</small></div>
    {mode==='student'?<><span className="status-pill submitted">✓ Submitted</span><small>P {r.present} · A {r.absent}</small></>:<><span className={Number(r.completed)===Number(r.total)?'status-pill submitted':'status-pill progress'}>{r.completed}/{r.total} Completed</span><small>{r.updated_at||''}</small></>}
    <ChevronDown className={open?'history-chevron rotated':'history-chevron'}/>
   </button>
   {open&&<div className="history-detail-panel">
    {mode==='period'?<>
     <div className="history-detail-meta"><span><strong>Class</strong>{r.display_name}</span><span><strong>Date</strong>{r.attendance_date}</span><span><strong>Completed</strong>{r.completed}/{r.total}</span></div>
     <div className="history-detail-table-wrap"><table className="history-detail-table"><thead><tr><th>Period</th><th>Subject</th><th>Teacher</th><th>Status</th></tr></thead><tbody>{(r.periods||[]).map((p:any,j:number)=><tr key={j}><td>{ordinal(p.period_no)} Period</td><td>{p.subject||'—'}</td><td>{p.teacher_name||'—'}</td><td><span className="history-status-text">{statusLabel(p.status)}</span></td></tr>)}</tbody></table></div>
     {!(r.periods||[]).length&&<div className="empty-mini">No period details available.</div>}
    </>:<>
     <div className="history-detail-meta"><span><strong>Class</strong>{r.display_name}</span><span><strong>Date</strong>{r.attendance_date}</span><span><strong>Submitted by</strong>{r.submitted_by||'—'}</span></div>
     {loadingDetail===key?<div className="empty-mini">Loading student details…</div>:<div className="history-detail-table-wrap"><table className="history-detail-table"><thead><tr><th>Admission</th><th>Student</th><th>Status</th></tr></thead><tbody>{(studentDetails[key]||[]).map((st:any)=><tr key={st.record_id}><td>{st.admission_number}</td><td>{st.full_name}</td><td><span className="history-status-text">{statusLabel(st.status)}</span></td></tr>)}</tbody></table></div>}
    </>}
   </div>}
  </article>
 })}</section></>
}
export function Reports(){
 type Kind='student'|'individual'|'teacher'
 const [classes,setClasses]=useState<SchoolClass[]>([]),[cid,setCid]=useState('ALL_GRADES'),[rows,setRows]=useState<any[]>([]),[studentOptions,setStudentOptions]=useState<any[]>([]),[periodRows,setPeriodRows]=useState<any[]>([]),[dailyRows,setDailyRows]=useState<any[]>([]),[kind,setKind]=useState<Kind>('student'),[studentId,setStudentId]=useState(''),[msg,setMsg]=useState(''),[from,setFrom]=useState(new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10)),[to,setTo]=useState(new Date().toISOString().slice(0,10))
 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(x=>setClasses(x.classes))},[])
 useEffect(()=>{if(kind!=='individual')return;let active=true;setStudentOptions([]);setStudentId('');setMsg('');const actualClass=cid&&cid!=='ALL_GRADES'&&!cid.startsWith('GRADE:')?cid:'';api<{report:any[]}>(`/api/reports?${actualClass?`class_id=${encodeURIComponent(actualClass)}`:''}`).then(x=>{if(!active)return;const filtered=cid.startsWith('GRADE:')?x.report.filter(r=>String(r.display_name||'').split('-')[0].trim()===cid.slice(6)):x.report;setStudentOptions(filtered);if(filtered.length)setStudentId(String(filtered[0].student_id))}).catch(()=>{if(active)setMsg('Could not load students.')});return()=>{active=false}},[kind,cid])
 async function load(){
  setMsg('')
  if(from>to){setMsg('Start date must be before the end date.');return}
  try{
   const gradeFilter=cid.startsWith('GRADE:')?cid.slice(6):''
   const isSpecific=cid&&cid!=='ALL_GRADES'&&!cid.startsWith('GRADE:')
   if(kind==='teacher'){
    const targets=isSpecific?classes.filter(c=>c.id===cid):gradeFilter?classes.filter(c=>String(c.display_name).split('-')[0].trim()===gradeFilter):classes
    if(!targets.length){setMsg('No classes match this selection.');return}
    const batches=await Promise.all(targets.map(c=>api<{history:any[]}>(`/api/period-history?from=${from}&to=${to}&class_id=${encodeURIComponent(c.id)}`).then(x=>x.history.map(r=>({...r,display_name:r.display_name||c.display_name,class_id:r.class_id||c.id}))).catch(()=>[])))
    setPeriodRows(batches.flat())
    setRows([])
    setDailyRows([])
   }else{
    const x=await api<{report:any[]}>(`/api/reports?from=${from}&to=${to}${isSpecific?`&class_id=${encodeURIComponent(cid)}`:''}`)
    const filtered=gradeFilter?x.report.filter(r=>String(r.display_name||'').split('-')[0].trim()===gradeFilter):x.report
    setRows(filtered)
    setPeriodRows([])
    if(kind==='individual'&&!studentId){setDailyRows([]);setMsg('Select a student.');return}
    let targets=isSpecific?classes.filter(c=>c.id===cid):gradeFilter?classes.filter(c=>String(c.display_name).split('-')[0].trim()===gradeFilter):classes
    if(kind==='individual'){
     const selected=filtered.find(r=>String(r.student_id)===String(studentId))
     if(selected)targets=classes.filter(c=>String(c.display_name)===String(selected.display_name))
    }
    const histories=await Promise.all(targets.map(c=>api<{sessions:any[]}>(`/api/history?from=${from}&to=${to}&class_id=${encodeURIComponent(c.id)}`).then(x=>x.sessions.map(session=>({...session,class_id:session.class_id||c.id,display_name:session.display_name||c.display_name}))).catch(()=>[])))
    const sessions=histories.flat()
    const detail=await Promise.all(sessions.map(session=>api<{session:any,records:any[]}>(`/api/attendance/${encodeURIComponent(session.session_id)}`).then(x=>x.records.map(r=>({...r,class_id:session.class_id,display_name:session.display_name,attendance_date:session.attendance_date}))).catch(()=>[])))
    const flat=detail.flat()
    setDailyRows(kind==='individual'?flat.filter(r=>String(r.student_id)===String(studentId)):flat)
   }
  }catch{setMsg('Could not generate report.')}
 }
 const visible=kind==='teacher'?periodRows:kind==='individual'?rows.filter(r=>String(r.student_id)===String(studentId)):rows
 const title=kind==='teacher'?'Teacher Attendance Report':kind==='individual'?'Individual Student Attendance Report':'Student Attendance Report'
 const reportScope=cid==='ALL_GRADES'?'All Grades':cid.startsWith('GRADE:')?'Grade '+cid.slice(6)+' — All Classes':classes.find(c=>c.id===cid)?.display_name||'Selected Class'
 const headers=kind==='teacher'?['Period','Status']:['Admission','Name','Class','Total Days','Present','Absent','Attendance %']
 const statusLabel=(v:any)=>String(v??'').replaceAll('_',' ').replace('NOT ARRIVED RELIEF','NO TEACHER PRESENTED')
 const ordinal=(n:any)=>{const x=Number(n);return x===1?'1st Period':x===2?'2nd Period':x===3?'3rd Period':`${x}th Period`}
 const gradeOf=(name:any)=>String(name||'').split('-')[0].trim()
 const matrix=kind==='teacher'?[]:visible.map(r=>[r.admission_number,r.full_name,r.display_name,r.total,r.present,r.absent,r.attendance_percentage??''])
 const dailyVisible=kind==='individual'?dailyRows.filter(r=>String(r.student_id)===String(studentId)):dailyRows
 const individualStudent=kind==='individual'?visible[0]:null
 const individualClass=String(individualStudent?.display_name||'')
 const individualGrade=gradeOf(individualClass)
 const individualGradeClass=individualClass.replaceAll('-','').replaceAll(' ','')
 const individualAttendance=kind==='individual'?dailyVisible.map(r=>({date:String(r.attendance_date||''),status:statusLabel(r.status)})).sort((a,b)=>a.date.localeCompare(b.date)):[]
 const studentGroups=kind==='teacher'?[]:Object.values(dailyVisible.reduce((acc:any,r:any)=>{const date=String(r.attendance_date||''),className=String(r.display_name||''),grade=gradeOf(className),key=grade+'|'+date+'|'+className;if(!acc[key])acc[key]={grade,date,className,records:[]};acc[key].records.push(r);return acc},{})).sort((a:any,b:any)=>String(a.grade).localeCompare(String(b.grade),undefined,{numeric:true})||String(a.date).localeCompare(String(b.date))||String(a.className).localeCompare(String(b.className),undefined,{numeric:true,sensitivity:'base'}))
 const teacherGroups=kind==='teacher'?Object.values(visible.reduce((acc:any,r:any)=>{const date=String(r.attendance_date||''),className=String(r.display_name||''),grade=gradeOf(className),key=grade+'|'+date+'|'+className;if(!acc[key])acc[key]={grade,date,className,periods:[]};acc[key].periods.push(...(r.periods||[]).map((p:any)=>({period:ordinal(p.period_no),status:statusLabel(p.status)})));return acc},{})).sort((a:any,b:any)=>String(a.grade).localeCompare(String(b.grade),undefined,{numeric:true})||String(a.date).localeCompare(String(b.date))||String(a.className).localeCompare(String(b.className),undefined,{numeric:true,sensitivity:'base'})):[]
 function esc(v:any){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
 function csvCell(v:any){return `"${String(v??'').replaceAll('"','""')}"`}
 function saveBytes(name:string,bytes:Uint8Array,mime:string){let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));const b64=btoa(bin),bridge=(window as any).AndroidDownloads;if(bridge?.saveFile){bridge.saveFile(name,b64);return}const blob=new Blob([bytes as BlobPart],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
 function save(name:string,content:string,mime:string){const bytes=new TextEncoder().encode(content),bin=Array.from(bytes,b=>String.fromCharCode(b)).join(''),b64=btoa(bin),bridge=(window as any).AndroidDownloads;if(bridge?.saveFile){bridge.saveFile(name,b64);return}const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
 function pdfText(v:any){return String(v??'').replace(/[^\x20-\x7E]/g,' ').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
 function jpegSize(bytes:Uint8Array){let i=2;while(i+9<bytes.length){if(bytes[i]!==0xff){i++;continue}const m=bytes[i+1];if(m>=0xc0&&m<=0xc3)return{h:(bytes[i+5]<<8)|bytes[i+6],w:(bytes[i+7]<<8)|bytes[i+8]};const len=(bytes[i+2]<<8)|bytes[i+3];if(!len)break;i+=2+len}return{w:100,h:100}}
 async function getReportLogo(){
  const visibleLogo=document.querySelector('.brand img,.mobile-brand-strip img') as HTMLImageElement|null
  const src=visibleLogo?.src||new URL('zahira-logo.jpg',document.baseURI).href
  const blob=await fetch(src,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('logo_load_failed');return r.blob()})
  const objectUrl=URL.createObjectURL(blob)
  try{
   const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('logo_decode_failed'));img.src=objectUrl})
   const canvas=document.createElement('canvas'),size=Math.max(256,Math.min(1024,Math.max(image.naturalWidth||256,image.naturalHeight||256)))
   canvas.width=size;canvas.height=size
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas_unavailable')
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size)
   const scale=Math.min(size/(image.naturalWidth||size),size/(image.naturalHeight||size)),w=(image.naturalWidth||size)*scale,h=(image.naturalHeight||size)*scale
   ctx.drawImage(image,(size-w)/2,(size-h)/2,w,h)
   const dataUrl=canvas.toDataURL('image/jpeg',.94),raw=atob(dataUrl.split(',')[1]),bytes=new Uint8Array(raw.length)
   for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i)
   return{dataUrl,bytes}
  }finally{URL.revokeObjectURL(objectUrl)}
 }
 async function makePdf(){
  if(!visible.length)return
  const reportLogo=await getReportLogo(),logo=reportLogo.bytes,dim=jpegSize(logo),enc=new TextEncoder(),objects:(Uint8Array|null)[]=[null]
  const add=(v:string|Uint8Array)=>{objects.push(typeof v==='string'?enc.encode(v):v);return objects.length-1}
  const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  const imgHead=enc.encode('<< /Type /XObject /Subtype /Image /Width '+dim.w+' /Height '+dim.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+logo.length+' >>\nstream\n'),imgTail=enc.encode('\nendstream'),img=new Uint8Array(imgHead.length+logo.length+imgTail.length)
  img.set(imgHead);img.set(logo,imgHead.length);img.set(imgTail,imgHead.length+logo.length)
  const image=add(img),pageIds:number[]=[],pageChunks:string[]=[]
  const generatedOn=new Date().toLocaleString('en-LK',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'})
  let y=735,cmd='q 1 1 1 rg 0 0 612 792 re f Q\nq 70 0 0 70 271 700 cm /Im0 Do Q\n'
  const line=(value:any,x:number,size=10,isBold=false)=>{cmd+='BT /'+(isBold?'F2':'F1')+' '+size+' Tf 0 0 0 rg '+x+' '+y+' Td ('+pdfText(value)+') Tj ET\n'}
  const centered=(value:any,size=10,isBold=false)=>{const t=pdfText(value),approx=t.length*size*.5;line(t,Math.max(35,(612-approx)/2),size,isBold)}
  const newPage=()=>{pageChunks.push(cmd);cmd='q 1 1 1 rg 0 0 612 792 re f Q\n';y=750}
  const caption=(group:any)=>{
   line('Grade: '+group.grade,36,10,true);y-=14
   line('Class: '+group.className,36,10,true);y-=14
   line('Date: '+group.date,36,10,true);y-=19
  }
  y=682;centered('Zahira College Matale',14,true);y-=20;centered(title,18,true);y-=18;centered('Date Range: '+from+' to '+to,9);y-=14;centered('Scope: '+reportScope,9);y-=14;centered('Generated: '+generatedOn,8);y-=26
  if(kind==='individual'){
   const r=individualStudent
   if(!r)return
   line('Name: '+r.full_name,36,12,true);y-=18
   line('Index Number: '+r.admission_number,36,10);y-=15
   line('Grade: '+individualGrade,36,10);y-=15
   line('Grade Class: '+individualGradeClass,36,10);y-=15
   line('Total Days: '+r.total,36,10);y-=15
   line('Days Present: '+r.present,36,10);y-=15
   line('Days Absent: '+r.absent,36,10);y-=15
   line('Attendance: '+(r.attendance_percentage??'--')+'%',36,10);y-=24
   const widths=[250,286],startX=38
   const drawIndividualRow=(vals:any[],header=false)=>{let x=startX;vals.forEach((v:any,i:number)=>{cmd+=(header?'0.92 0.92 0.92 rg':'1 1 1 rg')+' '+x+' '+(y-15)+' '+widths[i]+' 20 re f 0.7 G '+x+' '+(y-15)+' '+widths[i]+' 20 re S\nBT /'+(header?'F2':'F1')+' 8 Tf 0 0 0 rg '+(x+5)+' '+(y-8)+' Td ('+pdfText(v).slice(0,60)+') Tj ET\n';x+=widths[i]});y-=20}
   drawIndividualRow(['Date','Status'],true)
   for(const row of individualAttendance){
    if(y<60){newPage();line('Name: '+r.full_name,36,10,true);y-=14;line('Index Number: '+r.admission_number,36,9);y-=14;line('Grade: '+individualGrade,36,9);y-=14;line('Grade Class: '+individualGradeClass,36,9);y-=14;line('Total Days: '+r.total,36,9);y-=14;line('Days Present: '+r.present,36,9);y-=14;line('Days Absent: '+r.absent,36,9);y-=14;line('Attendance: '+(r.attendance_percentage??'--')+'%',36,9);y-=20;drawIndividualRow(['Date','Status'],true)}
    drawIndividualRow([row.date,row.status])
   }
  }else if(kind==='teacher'){
   const widths=[180,360],startX=36
   const drawRow=(vals:any[],header=false)=>{let x=startX;vals.forEach((v:any,i:number)=>{cmd+=(header?'0.92 0.92 0.92 rg':'1 1 1 rg')+' '+x+' '+(y-15)+' '+widths[i]+' 20 re f 0.7 G '+x+' '+(y-15)+' '+widths[i]+' 20 re S\nBT /'+(header?'F2':'F1')+' 8 Tf 0 0 0 rg '+(x+Math.max(4,(widths[i]-pdfText(v).slice(0,40).length*4)/2))+' '+(y-8)+' Td ('+pdfText(v).slice(0,40)+') Tj ET\n';x+=widths[i]});y-=20}
   for(const group of teacherGroups as any[]){
    if(y<150)newPage()
    caption(group);drawRow(['Period','Status'],true)
    for(const p of group.periods){if(y<60){newPage();caption(group);drawRow(['Period','Status'],true)}drawRow([p.period,p.status])}
    y-=16
   }
  }else{
   const widths=[92,298,150],startX=36
   const drawRow=(vals:any[],header=false)=>{let x=startX;vals.forEach((v:any,i:number)=>{cmd+=(header?'0.92 0.92 0.92 rg':'1 1 1 rg')+' '+x+' '+(y-15)+' '+widths[i]+' 20 re f 0.7 G '+x+' '+(y-15)+' '+widths[i]+' 20 re S\nBT /'+(header?'F2':'F1')+' 8 Tf 0 0 0 rg '+(x+5)+' '+(y-8)+' Td ('+pdfText(v).slice(0,55)+') Tj ET\n';x+=widths[i]});y-=20}
   for(const group of studentGroups as any[]){
    if(y<150)newPage()
    caption(group);drawRow(['Admission','Name','Status'],true)
    for(const r of group.records){if(y<60){newPage();caption(group);drawRow(['Admission','Name','Status'],true)}drawRow([r.admission_number,r.full_name,statusLabel(r.status)])}
    y-=16
   }
  }
  pageChunks.push(cmd)
  const numberedPages=pageChunks.map((content,i)=>content+'0.78 G 36 38 m 576 38 l S\nBT /F1 8 Tf 0.35 0.35 0.35 rg 36 24 Td ('+pdfText('Zahira College Matale')+') Tj ET\nBT /F1 8 Tf 0.35 0.35 0.35 rg 500 24 Td ('+pdfText('Page '+(i+1)+' of '+pageChunks.length)+') Tj ET\n')
  const pagesPlaceholder=add('')
  for(const content of numberedPages){const cb=enc.encode(content),stream=add('<< /Length '+cb.length+' >>\nstream\n'+content+'endstream'),pid=add('<< /Type /Page /Parent '+pagesPlaceholder+' 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 '+font+' 0 R /F2 '+bold+' 0 R >> /XObject << /Im0 '+image+' 0 R >> >> /Contents '+stream+' 0 R >>');pageIds.push(pid)}
  objects[pagesPlaceholder]=enc.encode('<< /Type /Pages /Kids ['+pageIds.map(p=>p+' 0 R').join(' ')+'] /Count '+pageIds.length+' >>')
  const catalog=add('<< /Type /Catalog /Pages '+pagesPlaceholder+' 0 R >>'),parts:Uint8Array[]=[enc.encode('%PDF-1.4\n%PDFGEN\n')],offsets=[0]
  let pos=parts[0].length
  for(let i=1;i<objects.length;i++){offsets[i]=pos;const h=enc.encode(i+' 0 obj\n'),t=enc.encode('\nendobj\n'),o=objects[i]!;parts.push(h,o,t);pos+=h.length+o.length+t.length}
  const xref=pos;let xt='xref\n0 '+objects.length+'\n0000000000 65535 f \n'
  for(let i=1;i<objects.length;i++)xt+=String(offsets[i]).padStart(10,'0')+' 00000 n \n'
  xt+='trailer\n<< /Size '+objects.length+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF'
  parts.push(enc.encode(xt))
  const total=parts.reduce((n,p)=>n+p.length,0),pdf=new Uint8Array(total);let at=0
  for(const p of parts){pdf.set(p,at);at+=p.length}
  saveBytes(kind+'-attendance-'+from+'-to-'+to+'.pdf',pdf,'application/pdf')
 }
  async function exportFile(format:'doc'){
   if(!visible.length)return
   const logoData=(await getReportLogo()).dataUrl
   const generatedOn=new Date().toLocaleString('en-LK',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'})
   const base=kind+'-attendance-'+from+'-to-'+to
   const css='<style>@page{margin:18mm 14mm 18mm}.report-doc{font-family:Arial,sans-serif}.report-header{text-align:center;margin-bottom:22px;border-bottom:2px solid #222;padding-bottom:14px}.school-logo{display:block;width:82px;height:82px;object-fit:contain;margin:0 auto 8px}.school-name{font-size:18px;font-weight:700;margin:0 0 5px}h1{font-size:24px;margin:0 0 7px}.report-meta{font-size:11px;color:#333;line-height:1.55}.student-card{border:1px solid #b8b8b8;padding:18px 20px;margin:18px 0 20px;text-align:left;page-break-inside:avoid}.student-name{font-size:22px;font-weight:700;margin-bottom:10px}.student-meta{display:grid;gap:6px;color:#222}.student-meta strong{font-weight:700}table.report{width:100%;border-collapse:collapse;background:#fff;color:#000;margin-bottom:18px}table.report thead{display:table-header-group}table.report tr{page-break-inside:avoid}table.report th,table.report td{border:1px solid #999;padding:8px;text-align:center}table.report th{background:#eee}.report-group{margin:0 0 28px;page-break-inside:auto}.report-caption{text-align:left;margin:0 0 8px;font-size:13px;page-break-after:avoid}.report-caption strong{display:block;margin:2px 0}.grade-label{font-size:15px}.doc-footer{margin-top:24px;padding-top:8px;border-top:1px solid #aaa;text-align:center;font-size:9px;color:#666}</style>'
   let content=''
   const dailyContent=()=> (studentGroups as any[]).map(group=>'<div class="report-group"><div class="report-caption"><strong class="grade-label">Grade: '+esc(group.grade)+'</strong><strong>Class: '+esc(group.className)+'</strong><strong>Date: '+esc(group.date)+'</strong></div><table class="report"><thead><tr><th>Admission</th><th>Name</th><th>Status</th></tr></thead><tbody>'+group.records.map((r:any)=>'<tr><td>'+esc(r.admission_number)+'</td><td>'+esc(r.full_name)+'</td><td>'+esc(statusLabel(r.status))+'</td></tr>').join('')+'</tbody></table></div>').join('')
   if(kind==='individual'){
    const r=individualStudent
    content='<div class="student-card"><div class="student-name">'+esc(r.full_name)+'</div><div class="student-meta"><div>Index Number: <strong>'+esc(r.admission_number)+'</strong></div><div>Grade: <strong>'+esc(individualGrade)+'</strong></div><div>Grade Class: <strong>'+esc(individualGradeClass)+'</strong></div><div>Total Days: <strong>'+esc(r.total)+'</strong></div><div>Days Present: <strong>'+esc(r.present)+'</strong></div><div>Days Absent: <strong>'+esc(r.absent)+'</strong></div><div>Attendance %: <strong>'+esc(r.attendance_percentage??'—')+'%</strong></div></div></div><table class="report"><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>'+individualAttendance.map(row=>'<tr><td>'+esc(row.date)+'</td><td>'+esc(row.status)+'</td></tr>').join('')+'</tbody></table>'
   }else if(kind==='teacher'){
    content=(teacherGroups as any[]).map(group=>'<div class="report-group"><div class="report-caption"><strong class="grade-label">Grade: '+esc(group.grade)+'</strong><strong>Class: '+esc(group.className)+'</strong><strong>Date: '+esc(group.date)+'</strong></div><table class="report"><thead><tr><th>Period</th><th>Status</th></tr></thead><tbody>'+group.periods.map((p:any)=>'<tr><td>'+esc(p.period)+'</td><td>'+esc(p.status)+'</td></tr>').join('')+'</tbody></table></div>').join('')
   }else{
    content=dailyContent()
   }
   if(format==='doc')save(base+'.doc','<html style="background:#fff;color:#000"><head><meta charset="utf-8">'+css+'</head><body class="report-doc" bgcolor="#ffffff" text="#000000"><div class="report-header"><img class="school-logo" src="'+logoData+'" width="82" height="82" alt="School logo"/><div class="school-name">Zahira College Matale</div><h1>'+esc(title)+'</h1><div class="report-meta">Date Range: '+esc(from)+' to '+esc(to)+'<br/>Scope: '+esc(reportScope)+'<br/>Generated: '+esc(generatedOn)+'</div></div>'+content+'<div class="doc-footer">Zahira College Matale · Generated '+esc(generatedOn)+'</div></body></html>','application/msword')
  }
 return <div className="reports-page"><div className="screen-title-row reports-heading"><div><h1>Reports</h1><p>Generate attendance reports for a selected date range and export them as a Word document.</p></div></div>
 <section className="report-builder">
  <div className="report-form-grid">
   <label><span>Start Date</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
   <label><span>End Date</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
   <label className="report-wide"><span>What to Export</span><select value={kind} onChange={e=>{const next=e.target.value as Kind;setKind(next);setCid('ALL_GRADES');setRows([]);setPeriodRows([]);setDailyRows([]);setStudentId('');setMsg('')}}><option value="student">Student Attendance</option><option value="individual">Individual Student Attendance</option><option value="teacher">Teacher Attendance</option></select></label>
   <label className="report-wide"><span>Class / Grade</span><select value={cid} onChange={e=>{setCid(e.target.value);setRows([]);setPeriodRows([]);setDailyRows([]);setStudentId('')}}><option value="ALL_GRADES">All Grades</option><option value="GRADE:6">Grade 6 — All</option><option value="GRADE:7">Grade 7 — All</option>{classes.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></label>
   {kind==='individual'&&<label className="report-wide"><span>Student</span><select value={studentId} onChange={e=>setStudentId(e.target.value)} disabled={!studentOptions.length}><option value="">{studentOptions.length?'Select student':'Loading students...'}</option>{studentOptions.map(r=><option key={r.student_id} value={r.student_id}>{r.admission_number} · {r.full_name} · {r.display_name}</option>)}</select></label>}
  </div>
  <button className="primary report-generate" onClick={load}>Generate Report</button>
 </section>
 {msg&&<div className="error">{msg}</div>}
 {visible.length>0&&<section className="report-output">
  <div className="report-output-head"><div><strong>{title}</strong><small>{from} → {to} · {visible.length} {visible.length===1?'record':'records'}</small></div>
   <details className="export-menu"><summary className="secondary">Export <span>▾</span></summary><div className="export-options"><button onClick={()=>exportFile('doc')}><strong>Document</strong><small>.doc</small></button><button onClick={makePdf}><strong>PDF</strong><small>.pdf</small></button></div></details>
  </div>
  {kind==='individual'&&individualStudent?<section className="individual-report-preview"><div className="individual-report-official"><img src={import.meta.env.BASE_URL+'zahira-logo.jpg'} alt="School logo"/><strong>Zahira College Matale</strong><h2>Individual Student Attendance Report</h2><small>Date Range: {from} to {to}</small></div><div className="individual-report-profile"><div><h3>Name: {individualStudent.full_name}</h3><p><span>Index Number</span><strong>{individualStudent.admission_number}</strong></p><p><span>Grade</span><strong>{individualGrade}</strong></p><p><span>Grade Class</span><strong>{individualGradeClass}</strong></p><p><span>Total Days</span><strong>{individualStudent.total}</strong></p><p><span>Days Present</span><strong>{individualStudent.present}</strong></p><p><span>Days Absent</span><strong>{individualStudent.absent}</strong></p><p><span>Attendance %</span><strong>{individualStudent.attendance_percentage??'—'}%</strong></p></div></div><table className="teacher-period-table individual-attendance-table"><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>{individualAttendance.map((row,i)=><tr key={row.date+'-'+i}><td>{row.date}</td><td>{row.status}</td></tr>)}</tbody></table></section>:kind==='teacher'?<section className="teacher-report-groups">{(teacherGroups as any[]).map(group=><section className="teacher-report-group" key={group.grade+'-'+group.className+'-'+group.date}><div className="teacher-report-caption"><div>Grade: <strong>{group.grade}</strong></div><div>Class: <strong>{group.className}</strong></div><div>Date: <strong>{group.date}</strong></div></div><table className="teacher-period-table"><thead><tr><th>Period</th><th>Status</th></tr></thead><tbody>{group.periods.map((p:any,i:number)=><tr key={group.className+'-'+group.date+'-'+i}><td>{p.period}</td><td>{p.status}</td></tr>)}</tbody></table></section>)}</section>:<section className="teacher-report-groups">{(studentGroups as any[]).map(group=><section className="teacher-report-group" key={group.grade+'-'+group.className+'-'+group.date}><div className="teacher-report-caption"><div>Grade: <strong>{group.grade}</strong></div><div>Class: <strong>{group.className}</strong></div><div>Date: <strong>{group.date}</strong></div></div><table className="teacher-period-table"><thead><tr><th>Admission</th><th>Name</th><th>Status</th></tr></thead><tbody>{group.records.map((r:any,i:number)=><tr key={group.date+'-'+r.student_id+'-'+i}><td>{r.admission_number}</td><td>{r.full_name}</td><td>{statusLabel(r.status)}</td></tr>)}</tbody></table></section>)}</section>}
 </section>}
 </div>}
export function Calendar(){const [rows,setRows]=useState<any[]>([]),[day,setDay]=useState(''),[type,setType]=useState('HOLIDAY'),[label,setLabel]=useState('');async function load(){setRows((await api<{days:any[]}>('/api/calendar')).days)}useEffect(()=>{load()},[]);return <><div className="screen-title-row"><div><h1>School Calendar</h1><p>School days, holidays and special days.</p></div></div><form className="filters" onSubmit={async e=>{e.preventDefault();await api('/api/calendar',{method:'POST',body:JSON.stringify({day,day_type:type,label})});setDay('');setLabel('');load()}}><input required type="date" value={day} onChange={e=>setDay(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option>HOLIDAY</option><option>SPECIAL_HOLIDAY</option><option>SPECIAL_SCHOOL_DAY</option><option>SCHOOL_DAY</option><option>WEEKEND</option></select><input placeholder="Label / reason" value={label} onChange={e=>setLabel(e.target.value)}/><button className="primary">Save Day</button></form><section className="data-list">{rows.map(r=><article key={r.day}><div><strong>{r.day}</strong><small>{r.label||'No label'}</small></div><span>{r.day_type}</span><button className="link" onClick={async()=>{await api(`/api/calendar?day=${r.day}`,{method:'DELETE'});load()}}>Remove</button></article>)}</section></>}
export function Audit(){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{api<{logs:any[]}>('/api/audit').then(x=>setRows(x.logs))},[]);return <><div className="screen-title-row"><div><h1>Audit Log</h1><p>Latest administrative and attendance actions.</p></div></div><section className="data-list">{rows.map(r=><article key={r.id}><div><strong>{r.action}</strong><small>{r.created_at} · {r.full_name||'System'}</small></div><span>{r.target_type}{r.target_id?` · ${r.target_id}`:''}</span></article>)}</section></>}
export function Settings(){
 const {profile}=useAuth(),admin=profile?.role==='SECTION_HEAD'
 const [s,setS]=useState<any>({attendance_threshold:'80',school_timezone:'Asia/Colombo',teacher_correction_allowed:'false'}),[msg,setMsg]=useState(''),[error,setError]=useState('')
 const [teachers,setTeachers]=useState<any[]>([]),[teacherSearch,setTeacherSearch]=useState(''),[deletingTeacher,setDeletingTeacher]=useState<string|null>(null)
 const [tempHeads,setTempHeads]=useState<any[]>([]),[tempName,setTempName]=useState(''),[tempUsername,setTempUsername]=useState(''),[tempPassword,setTempPassword]=useState(''),[tempAllowed,setTempAllowed]=useState(false),[tempBackendReady,setTempBackendReady]=useState(true),[creatingTemp,setCreatingTemp]=useState(false)
 const [fontSize,setFontSize]=useState<'small'|'default'|'large'|'extra-large'>(()=>{const v=localStorage.getItem('school-attendance-font-size');return v==='small'||v==='large'||v==='extra-large'?v:'default'})
 function changeFontSize(value:'small'|'default'|'large'|'extra-large'){setFontSize(value);localStorage.setItem('school-attendance-font-size',value);document.documentElement.dataset.fontSize=value}
 useEffect(()=>{if(admin){api<{settings:any}>('/api/settings').then(x=>setS(x.settings)).catch(()=>setError('Could not load system settings.'));api<{teachers:any[]}>('/api/teachers').then(x=>setTeachers(x.teachers)).catch(()=>setError('Could not load teachers.'));api<{accounts:any[]}>('/api/temporary-section-heads').then(x=>{setTempHeads(x.accounts);setTempAllowed(true);setTempBackendReady(true)}).catch((e:any)=>{if(e?.message==='primary_section_head_only'||e?.message==='forbidden')setTempAllowed(false);else{setTempAllowed(false);setTempBackendReady(false)}})}},[admin])
 const filteredTeachers=useMemo(()=>teachers.filter(t=>`${t.full_name} ${t.username}`.toLowerCase().includes(teacherSearch.toLowerCase())),[teachers,teacherSearch])
 async function deleteTeacher(t:any){const typed=prompt(`Permanently delete teacher ${t.full_name}?\n\nType the username "${t.username}" to confirm.`);if(typed===null)return;if(typed.trim().toLowerCase()!==String(t.username).toLowerCase()){setError('Username did not match.');return}setDeletingTeacher(t.id);try{await api(`/api/teachers/${encodeURIComponent(t.id)}`,{method:'DELETE'});setTeachers(xs=>xs.filter(x=>x.id!==t.id));setMsg(`${t.full_name} was permanently deleted ✓`)}catch{setError('Could not permanently delete this teacher.')}finally{setDeletingTeacher(null)}}

 return <><div className="screen-title-row"><div><h1>Settings</h1><p>{admin?'System settings and permanent student record management.':'Student record management for your assigned classes.'}</p></div></div>

 {admin&&<details className="settings-form settings-accordion">
  <summary className="settings-summary"><strong>Attendance Settings</strong><span>Threshold, timezone and correction permissions</span></summary>
  <div className="settings-accordion-content">
   <label>Low attendance threshold (%)<input type="number" min="1" max="100" value={s.attendance_threshold||80} onChange={e=>setS({...s,attendance_threshold:e.target.value})}/></label>
   <label>School timezone<input value={s.school_timezone||''} onChange={e=>setS({...s,school_timezone:e.target.value})}/></label>
   <label className="toggle"><input type="checkbox" checked={s.teacher_correction_allowed==='true'} onChange={e=>setS({...s,teacher_correction_allowed:String(e.target.checked)})}/> Allow teachers to correct submitted attendance</label>
   <button className="primary" onClick={async()=>{try{await api('/api/settings',{method:'PUT',body:JSON.stringify(s)});setMsg('Settings saved ✓');setError('')}catch{setError('Could not save settings.')}}}>Save Settings</button>
  </div>
 </details>}

 <details className="settings-form settings-accordion">
  <summary className="settings-summary"><strong>Font Size</strong><span>Adjust text size across the app</span></summary>
  <div className="settings-accordion-content">
   <div className="font-size-options" role="group" aria-label="Font size">
    {(['small','default','large','extra-large'] as const).map(value=><button key={value} type="button" className={fontSize===value?'font-size-option active':'font-size-option'} onClick={()=>changeFontSize(value)}>{value==='small'?'Small':value==='default'?'Default':value==='large'?'Large':'Extra Large'}</button>)}
   </div>
   <p className="font-size-note">This preference is saved on this device and applies to both Section Head and Teacher screens.</p>
  </div>
 </details>

 {admin&&tempAllowed&&<details className="settings-form temporary-head-settings settings-accordion">
  <summary className="settings-summary"><strong>Temporary Section Head Login</strong><span>Create and revoke temporary administrator access</span></summary>
  <div className="settings-accordion-content">
   <p>Create a temporary Section Head login for another authorized person. You can revoke it at any time.</p>
   {!tempBackendReady&&<div className="error">Temporary login service is not available on the backend yet. The section is visible, but account creation will work after the backend update is deployed.</div>}
   <div className="temp-head-form">
    <label><span>Name</span><input value={tempName} onChange={e=>setTempName(e.target.value)} placeholder="Person's name"/></label>
    <label><span>Username</span><input value={tempUsername} onChange={e=>setTempUsername(e.target.value)} placeholder="Temporary username" autoCapitalize="none"/></label>
    <label><span>Temporary Password</span><input type="password" value={tempPassword} onChange={e=>setTempPassword(e.target.value)} placeholder="4–64 characters"/></label>
   </div>
   <button className="primary" disabled={creatingTemp||!tempName.trim()||tempUsername.trim().length<3||tempPassword.length<4} onClick={async()=>{setCreatingTemp(true);setError('');try{const x=await api<{account:any}>('/api/temporary-section-heads',{method:'POST',body:JSON.stringify({full_name:tempName,username:tempUsername,password:tempPassword})});setTempHeads(v=>[x.account,...v]);setTempName('');setTempUsername('');setTempPassword('');setMsg('Temporary Section Head login created ✓')}catch(e:any){setError(e?.message==='username_already_exists'?'That username is already in use.':'Could not create temporary Section Head login.')}finally{setCreatingTemp(false)}}}>{creatingTemp?'Creating…':'Create Temporary Login'}</button>
   {tempHeads.length>0&&<div className="temp-head-list">{tempHeads.map(t=><article key={t.id}><div><strong>{t.full_name}</strong><small>@{t.username} · Temporary Section Head</small></div><button className="permanent-delete" onClick={async()=>{if(!confirm(`Delete temporary Section Head @${t.username}? This will immediately sign out that account.`))return;try{await api(`/api/temporary-section-heads/${encodeURIComponent(t.id)}`,{method:'DELETE'});setTempHeads(v=>v.filter(x=>x.id!==t.id));setMsg('Temporary Section Head login deleted ✓')}catch{setError('Could not delete temporary Section Head login.')}}}><Trash2/>Delete</button></article>)}</div>}
  </div>
 </details>}

 {(!admin||tempAllowed)&&<details className="settings-form settings-accordion"><summary className="settings-summary"><strong>Student Deletion</strong><span>Individual or bulk permanent student removal</span></summary><div className="settings-accordion-content"><p>Search students, delete one record at a time, or select multiple students and use swipe-to-confirm bulk deletion.</p><Link className="primary" to="/student-deletion">Open Student Deletion</Link></div></details>}

 {admin&&tempAllowed&&<details className="student-delete-settings settings-accordion"><summary className="settings-summary danger-settings-summary"><strong>Permanent Teacher Deletion</strong><span>Section Head only · destructive action</span></summary><div className="settings-accordion-content"><div className="danger-heading"><AlertTriangle/><div><p>Permanently removes the teacher account, class assignments, sessions and teacher attendance records.</p></div></div><label className="search modern-search"><Search/><input placeholder="Search teacher name or username…" value={teacherSearch} onChange={e=>setTeacherSearch(e.target.value)}/></label><div className="danger-note"><strong>Permanent action</strong><span>You must type the teacher's username to confirm deletion.</span></div><div className="student-delete-list">{filteredTeachers.map(t=><article key={t.id}><div><strong>{t.full_name}</strong><small>@{t.username}{t.class_teacher_of?.display_name?` · Class Teacher ${t.class_teacher_of.display_name}`:''}</small></div><button className="permanent-delete" disabled={deletingTeacher===t.id} onClick={()=>deleteTeacher(t)}><Trash2/>{deletingTeacher===t.id?'Deleting…':'Delete Permanently'}</button></article>)}{!filteredTeachers.length&&<div className="empty-mini">No matching teachers.</div>}</div></div></details>}
 {error&&<div className="error">{error}</div>}{msg&&<div className="notice">{msg}</div>}

 <details className="settings-form about-section settings-accordion">
  <summary className="settings-summary"><strong>About School Attendance</strong><span>App information and features</span></summary>
  <div className="about-content">
  <p>A centralized school attendance management system designed for fast, accurate student and teacher attendance management across mobile and web devices.</p>
  <div className="about-feature-grid">
   <div><strong>Student Attendance</strong><span>Mark daily attendance by class, track present and absent students, and review attendance history.</span></div>
   <div><strong>Individual Attendance</strong><span>Search students and view each student's attendance totals and attendance percentage.</span></div>
   <div><strong>Teacher Attendance</strong><span>Maintain teacher period attendance and review completed and incomplete period registers.</span></div>
   <div><strong>Reports</strong><span>Generate student, individual student, and teacher attendance reports for a selected date range and export reports as Word documents.</span></div>
   <div><strong>Classes & Records</strong><span>Manage school classes and student records with dedicated administrative controls.</span></div>
   <div><strong>School Calendar</strong><span>Maintain school days, weekends, holidays, special holidays, and special school days.</span></div>
   <div><strong>Roles & Access</strong><span>Separate Section Head and Teacher access so each role receives the appropriate management tools.</span></div>
   <div><strong>Administration & Audit</strong><span>System settings, attendance thresholds, correction controls, permanent record deletion, and administrative audit history.</span></div>
   <div><strong>Cross-device System</strong><span>The Android app and web application use the same central attendance system so records remain consistent across supported devices.</span></div>
   <div><strong>App Updates</strong><span>The Android application can check for newer released versions to keep the installed app up to date.</span></div>
  </div>
  </div>
 </details>
 <section className="copyright-legal">
  <strong>Copyright © 2026 Mohammed Azeem. All rights reserved.</strong>
  <p>This School Attendance Management System is proprietary software. Except as permitted by applicable law or with written permission from the copyright owner, unauthorized copying, modification, redistribution, resale, republication, or distribution of this software or its source code is prohibited.</p>
  <p>Third-party libraries and components remain subject to their respective licenses. School names, logos, trademarks, and other institutional branding remain the property of their respective owners.</p>
 </section>
 <div className="creator-credit settings-credit"><small>CREATOR &amp; DEVELOPER</small><strong>Created and developed by Mohammed Azeem ©</strong><span>School Attendance Management System</span></div>
 </>}

export function IndividualAttendance(){
 const [classes,setClasses]=useState<SchoolClass[]>([]),[rows,setRows]=useState<any[]>([]),[search,setSearch]=useState(''),[grade,setGrade]=useState('ALL'),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{api<{classes:SchoolClass[]}>('/api/classes').then(async x=>{setClasses(x.classes);try{const all=(await Promise.all(x.classes.map(c=>api<{report:any[]}>(`/api/reports?class_id=${encodeURIComponent(c.id)}`).then(r=>r.report.map(s=>({...s,class_id:c.id})))))).flat();setRows(all);setError('')}catch{setError('Could not load individual attendance.')}finally{setLoading(false)}}).catch(()=>{setError('Could not load classes.');setLoading(false)})},[])
 const grades=Array.from(new Set(classes.map(c=>String(c.display_name).split('-')[0].trim()))).sort()
 const filtered=rows.filter(r=>(grade==='ALL'||String(r.display_name).startsWith(grade+'-'))&&(!search.trim()||`${r.full_name} ${r.admission_number}`.toLowerCase().includes(search.trim().toLowerCase()))).sort((a,b)=>String(a.display_name).localeCompare(String(b.display_name))||String(a.admission_number).localeCompare(String(b.admission_number),undefined,{numeric:true}))
 return <><div className="screen-title-row"><div><h1>Individual Attendance</h1><p>Attendance count for each student.</p></div></div>
 <div className="filters"><label className="search modern-search"><Search/><input placeholder="Search name or admission number…" value={search} onChange={e=>setSearch(e.target.value)}/></label><select value={grade} onChange={e=>setGrade(e.target.value)}><option value="ALL">All Grades</option>{grades.map(g=><option key={g} value={g}>Grade {g}</option>)}</select></div>
 {loading&&<div className="loading">Loading attendance…</div>}{error&&<div className="error">{error}</div>}
 <section className="report-list">{filtered.map(r=><article key={r.student_id}><div><small>{r.admission_number} · {r.display_name}</small><strong>{r.full_name}</strong></div><span className="green"><strong>{Number(r.present||0)}</strong> attended</span><span className="red"><strong>{Number(r.absent||0)}</strong> absent</span><strong>{Number(r.present||0)}/{Number(r.total||0)} days</strong></article>)}</section>
 {!loading&&!error&&!filtered.length&&<div className="empty-card">No matching students.</div>}</>
}

export function StudentDeletion(){
 const {profile}=useAuth()
 const [students,setStudents]=useState<any[]>([]),[search,setSearch]=useState(''),[deleting,setDeleting]=useState<string|null>(null),[bulkDeleting,setBulkDeleting]=useState(false),[selected,setSelected]=useState<Set<string>>(()=>new Set()),[expandedGrades,setExpandedGrades]=useState<Set<string>>(()=>new Set()),[expandedClasses,setExpandedClasses]=useState<Set<string>>(()=>new Set()),[deleteAllowed,setDeleteAllowed]=useState(profile?.role!=='SECTION_HEAD'),[accessChecked,setAccessChecked]=useState(profile?.role!=='SECTION_HEAD'),[error,setError]=useState(''),[msg,setMsg]=useState(''),[swipe,setSwipe]=useState(0)
 const swipeRef=useRef({active:false,startX:0,width:1,pointerId:-1})
 useEffect(()=>{
  let active=true
  async function load(){
   if(profile?.role==='SECTION_HEAD'){
    try{await api('/api/temporary-section-heads');if(!active)return;setDeleteAllowed(true)}
    catch{if(!active)return;setDeleteAllowed(false);setAccessChecked(true);return}
   }else setDeleteAllowed(true)
   try{const x=await api<{students:any[]}>('/api/student-records');if(active)setStudents(x.students)}catch{if(active)setError('Could not load student records.')}
   if(active)setAccessChecked(true)
  }
  load();return()=>{active=false}
 },[profile?.role])
 const filtered=useMemo(()=>students.filter(st=>`${st.full_name} ${st.admission_number} ${st.display_name}`.toLowerCase().includes(search.toLowerCase())),[students,search])
 const grouped=useMemo(()=>{
  const grades=new Map<string,Map<string,any[]>>()
  for(const st of filtered){
   const className=String(st.display_name||'Other')
   const grade=className.includes('-')?className.split('-')[0].trim():className.trim()||'Other'
   if(!grades.has(grade))grades.set(grade,new Map())
   const classes=grades.get(grade)!
   if(!classes.has(className))classes.set(className,[])
   classes.get(className)!.push(st)
  }
  return [...grades.entries()].map(([grade,classes])=>({
   grade,
   total:[...classes.values()].reduce((n,list)=>n+list.length,0),
   classes:[...classes.entries()].map(([className,list])=>({className,students:list.sort((a,b)=>String(a.admission_number).localeCompare(String(b.admission_number),undefined,{numeric:true,sensitivity:'base'}))})).sort((a,b)=>a.className.localeCompare(b.className,undefined,{numeric:true,sensitivity:'base'}))
  })).sort((a,b)=>a.grade.localeCompare(b.grade,undefined,{numeric:true,sensitivity:'base'}))
 },[filtered])
 const visibleIds=useMemo(()=>filtered.map(st=>String(st.id)),[filtered])
 const allVisibleSelected=visibleIds.length>0&&visibleIds.every(id=>selected.has(id))
 function toggle(id:string){setSelected(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next})}
 function toggleVisible(){setSelected(prev=>{const next=new Set(prev);if(allVisibleSelected)visibleIds.forEach(id=>next.delete(id));else visibleIds.forEach(id=>next.add(id));return next})}
 function toggleGrade(grade:string){setExpandedGrades(prev=>{const next=new Set(prev);next.has(grade)?next.delete(grade):next.add(grade);return next})}
 function toggleClass(className:string){setExpandedClasses(prev=>{const next=new Set(prev);next.has(className)?next.delete(className):next.add(className);return next})}
 function selectClass(list:any[]){const ids=list.map(st=>String(st.id)),all=ids.every(id=>selected.has(id));setSelected(prev=>{const next=new Set(prev);ids.forEach(id=>all?next.delete(id):next.add(id));return next})}
 async function remove(st:any){
  const typed=prompt(`Permanently delete ${st.full_name}?\n\nType the admission number "${st.admission_number}" to confirm.`)
  if(typed===null)return
  if(typed.trim()!==String(st.admission_number)){setError('Admission number did not match.');return}
  setDeleting(st.id);setError('');setMsg('')
  try{await api(`/api/students/${encodeURIComponent(st.id)}`,{method:'DELETE'});setStudents(xs=>xs.filter(x=>x.id!==st.id));setSelected(prev=>{const next=new Set(prev);next.delete(String(st.id));return next});setMsg(`${st.full_name} was permanently deleted ✓`)}
  catch{setError('Could not permanently delete this student.')}
  finally{setDeleting(null)}
 }
 async function bulkDelete(){
  if(!selected.size||bulkDeleting)return
  const targets=students.filter(st=>selected.has(String(st.id)))
  setBulkDeleting(true);setError('');setMsg('')
  let deleted=0,failed=0
  for(const st of targets){try{await api(`/api/students/${encodeURIComponent(st.id)}`,{method:'DELETE',silentSuccess:true});deleted++}catch{failed++}}
  if(failed===0){setStudents(xs=>xs.filter(st=>!selected.has(String(st.id))));setSelected(new Set());setMsg(`${deleted} student${deleted===1?'':'s'} permanently deleted ✓`)}
  else{try{const fresh=await api<{students:any[]}>('/api/student-records');setStudents(fresh.students);const existing=new Set(fresh.students.map(st=>String(st.id)));setSelected(prev=>new Set([...prev].filter(id=>existing.has(id))))}catch{}setError(`${deleted} deleted, ${failed} could not be deleted.`)}
  setBulkDeleting(false);setSwipe(0)
 }
 function swipeStart(e:any){if(!selected.size||bulkDeleting)return;const rect=e.currentTarget.getBoundingClientRect();swipeRef.current={active:true,startX:e.clientX,width:Math.max(1,rect.width-58),pointerId:e.pointerId};e.currentTarget.setPointerCapture?.(e.pointerId)}
 function swipeMove(e:any){const p=swipeRef.current;if(!p.active||p.pointerId!==e.pointerId)return;const distance=Math.max(0,Math.min(p.width,e.clientX-p.startX));setSwipe(distance/p.width)}
 function swipeEnd(e:any){const p=swipeRef.current;if(!p.active||p.pointerId!==e.pointerId)return;swipeRef.current.active=false;if(swipe>=.82){setSwipe(1);void bulkDelete()}else setSwipe(0)}
 if(!accessChecked)return <div className="loading">Checking deletion permission…</div>
 if(!deleteAllowed)return <><div className="screen-title-row"><div><h1>Student Deletion</h1><p>Permanent deletion is restricted.</p></div></div><div className="error">Temporary Section Head accounts cannot delete students or teachers. Only the primary Section Head can perform permanent deletion.</div></>
 return <>
  <div className="screen-title-row"><div><h1>Student Deletion</h1><p>Students are separated by expandable grade and grade class.</p></div></div>
  <section className="student-delete-settings">
   <div className="danger-heading"><AlertTriangle/><div><h3>Permanent Student Deletion</h3><p>Deleting students removes their records, class history and attendance records.</p></div></div>
   <label className="search modern-search"><Search/><input placeholder="Search name, admission number or class…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <div className="bulk-delete-toolbar">
    <label className="bulk-select-all"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible}/><span>{allVisibleSelected?'Deselect visible':'Select all visible'}</span></label>
    <strong>{selected.size} selected</strong>
   </div>
   <div className="danger-note"><strong>Permanent action</strong><span>Expand a grade, then a grade class. Bulk deletion requires a full swipe to confirm.</span></div>
   <div className="student-delete-grade-groups">
    {grouped.map(group=>{
     const gradeOpen=search.trim()?true:expandedGrades.has(group.grade)
     return <section className="student-delete-grade" key={group.grade}>
      <button type="button" className="student-delete-grade-head" onClick={()=>toggleGrade(group.grade)}>
       <div><strong>Grade {group.grade}</strong><small>{group.total} student{group.total===1?'':'s'} · {group.classes.length} class{group.classes.length===1?'':'es'}</small></div>
       <ChevronDown className={gradeOpen?'rotated':''}/>
      </button>
      {gradeOpen&&<div className="student-delete-class-groups">
       {group.classes.map(cls=>{
        const classOpen=search.trim()?true:expandedClasses.has(cls.className)
        const ids=cls.students.map(st=>String(st.id)),allClassSelected=ids.length>0&&ids.every(id=>selected.has(id))
        return <section className="student-delete-class" key={cls.className}>
         <div className="student-delete-class-head">
          <button type="button" className="student-delete-class-toggle" onClick={()=>toggleClass(cls.className)}>
           <div><strong>{cls.className}</strong><small>{cls.students.length} student{cls.students.length===1?'':'s'}</small></div>
           <ChevronDown className={classOpen?'rotated':''}/>
          </button>
          <label className="class-select-all"><input type="checkbox" checked={allClassSelected} onChange={()=>selectClass(cls.students)}/><span>{allClassSelected?'Deselect class':'Select class'}</span></label>
         </div>
         {classOpen&&<div className="student-delete-list bulk-student-delete-list">{cls.students.map(st=><article key={st.id} className={selected.has(String(st.id))?'selected':''}>
          <label className="bulk-student-checkbox" aria-label={`Select ${st.full_name}`}><input type="checkbox" checked={selected.has(String(st.id))} onChange={()=>toggle(String(st.id))}/><span/></label>
          <div><strong>{st.full_name}</strong><small>{st.admission_number}</small></div>
          <button className="permanent-delete" disabled={deleting===st.id||bulkDeleting} onClick={()=>remove(st)}><Trash2/>{deleting===st.id?'Deleting…':'Delete'}</button>
         </article>)}</div>}
        </section>
       })}
      </div>}
     </section>
    })}
    {!grouped.length&&<div className="empty-mini">No matching students.</div>}
   </div>
  </section>
  {selected.size>0&&<div className="bulk-swipe-floating-shell">
   <div className="bulk-swipe-floating">
    <div className="bulk-swipe-label"><strong>{bulkDeleting?'Deleting selected students…':`${selected.size} student${selected.size===1?'':'s'} selected`}</strong><small>{bulkDeleting?'Please wait…':'Swipe to permanently delete · This cannot be undone'}</small></div>
    <div className="bulk-swipe-track" onPointerDown={swipeStart} onPointerMove={swipeMove} onPointerUp={swipeEnd} onPointerCancel={()=>{swipeRef.current.active=false;setSwipe(0)}} style={{'--swipe-progress':swipe} as any}>
     <div className="bulk-swipe-fill"/>
     <div className="bulk-swipe-thumb"><Trash2 size={18}/></div>
     <span>{bulkDeleting?'Deleting…':'Swipe to confirm'}</span>
    </div>
   </div>
  </div>}
  {error&&<div className="error">{error}</div>}{msg&&<div className="notice">{msg}</div>}
 </>}