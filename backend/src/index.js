const JSON_HEADERS={"content-type":"application/json;charset=UTF-8"};
const cors={"access-control-allow-origin":"*","access-control-allow-headers":"content-type,authorization","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS"};
const out=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...cors}});
const id=()=>crypto.randomUUID();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function sha256(s){return hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))}
async function hashPassword(password,salt=id()){const data=new TextEncoder().encode(password);const key=await crypto.subtle.importKey("raw",data,"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:210000,hash:"SHA-256"},key,256);return "pbkdf2$210000$"+salt+"$"+hex(bits)}
async function verifyPassword(password,stored){const [kind,it,salt,want]=stored.split("$");if(kind!=="pbkdf2")return false;const data=new TextEncoder().encode(password);const key=await crypto.subtle.importKey("raw",data,"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:Number(it),hash:"SHA-256"},key,256);return hex(bits)===want}
async function userFromRequest(req,env){const h=req.headers.get("authorization")||"";if(!h.startsWith("Bearer "))return null;const token=h.slice(7);const th=await sha256(token);return env.DB.prepare(`SELECT u.id,u.full_name,u.username,u.role,u.is_active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>datetime('now') AND u.is_active=1`).bind(th).first()}
async function canClass(env,u,classId){if(u.role==="SECTION_HEAD")return true;return !!await env.DB.prepare("SELECT 1 ok FROM teacher_class_assignments WHERE teacher_id=? AND class_id=? AND is_active=1").bind(u.id,classId).first()}
async function json(req){try{return await req.json()}catch{return null}}

export default {async fetch(req,env){
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  const url=new URL(req.url), p=url.pathname.replace(/\/$/,"")||"/";
  try{
    if(p==="/api/health") return out({ok:true,service:"school-attendance-api",database:"D1"});
    if(p==="/api/setup/status"&&req.method==="GET"){
      const row=await env.DB.prepare("SELECT COUNT(*) count FROM users WHERE role='SECTION_HEAD'").first();
      return out({needs_section_head:Number(row?.count||0)===0});
    }
    if(p==="/api/setup/section-head"&&req.method==="POST"){
      const exists=await env.DB.prepare("SELECT 1 FROM users WHERE role='SECTION_HEAD' LIMIT 1").first();
      if(exists)return out({error:"initial_setup_complete"},409);
      const b=await json(req); if(!b?.full_name||!b?.username||!b?.password||b.password.length<10)return out({error:"full_name_username_and_password_min_10_required"},400);
      const uid=id(), ph=await hashPassword(b.password);
      await env.DB.prepare("INSERT INTO users(id,full_name,email,username,password_hash,role) VALUES(?,?,?,?,?, 'SECTION_HEAD')").bind(uid,b.full_name.trim(),b.username.trim().toLowerCase()+'@local.invalid',b.username.trim().toLowerCase(),ph).run();
      return out({ok:true,user_id:uid},201);
    }
    if(p==="/api/auth/login"&&req.method==="POST"){
      const b=await json(req); const u=await env.DB.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE AND is_active=1").bind(b?.username||"").first();
      if(!u||!await verifyPassword(b?.password||"",u.password_hash))return out({error:"invalid_credentials"},401);
      const token=hex(crypto.getRandomValues(new Uint8Array(32))), th=await sha256(token), sid=id();
      await env.DB.prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,datetime('now','+30 days'))").bind(sid,u.id,th).run();
      return out({token,user:{id:u.id,full_name:u.full_name,username:u.username,role:u.role}});
    }
    const u=await userFromRequest(req,env); if(!u)return out({error:"unauthorized"},401);
    if(p==="/api/auth/me"&&req.method==="GET")return out({user:u});
    if(p==="/api/auth/logout"&&req.method==="POST"){const h=req.headers.get("authorization").slice(7);await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(h)).run();return out({ok:true})}
    if(p==="/api/classes"&&req.method==="GET"){
      const q=u.role==="SECTION_HEAD"?"SELECT * FROM classes WHERE is_active=1 ORDER BY display_name":"SELECT c.* FROM classes c JOIN teacher_class_assignments a ON a.class_id=c.id WHERE a.teacher_id=? AND a.is_active=1 AND c.is_active=1 ORDER BY c.display_name";
      const r=u.role==="SECTION_HEAD"?await env.DB.prepare(q).all():await env.DB.prepare(q).bind(u.id).all();return out({classes:r.results});
    }
    const sm=p.match(/^\/api\/classes\/([^/]+)\/students$/);
    if(sm&&req.method==="GET"){const classId=decodeURIComponent(sm[1]);if(!await canClass(env,u,classId))return out({error:"forbidden"},403);const r=await env.DB.prepare("SELECT id,admission_number,full_name,class_id FROM students WHERE class_id=? AND is_active=1 ORDER BY full_name").bind(classId).all();return out({students:r.results})}
    if(p==="/api/attendance"&&req.method==="POST"){
      const b=await json(req);if(!b?.class_id||!/^\d{4}-\d{2}-\d{2}$/.test(b?.date||"")||!Array.isArray(b?.records))return out({error:"invalid_request"},400);
      if(!await canClass(env,u,b.class_id))return out({error:"forbidden"},403);
      const blocked=await env.DB.prepare("SELECT 1 FROM school_days WHERE day=? AND day_type IN ('WEEKEND','HOLIDAY','SPECIAL_HOLIDAY')").bind(b.date).first();if(blocked)return out({error:"not_a_school_day"},409);
      const students=(await env.DB.prepare("SELECT id FROM students WHERE class_id=? AND is_active=1").bind(b.class_id).all()).results;const allowed=new Set(students.map(x=>x.id));
      if(!students.length||b.records.length!==students.length||new Set(b.records.map(x=>x.student_id)).size!==students.length||b.records.some(x=>!allowed.has(x.student_id)||!["PRESENT","ABSENT","LATE"].includes(x.status)))return out({error:"incomplete_or_invalid_register"},400);
      const sid=id();const stmts=[env.DB.prepare("INSERT INTO attendance_sessions(id,class_id,attendance_date,submitted_by) VALUES(?,?,?,?)").bind(sid,b.class_id,b.date,u.id)];
      for(const r of b.records)stmts.push(env.DB.prepare("INSERT INTO attendance_records(id,session_id,student_id,status,marked_by) VALUES(?,?,?,?,?)").bind(id(),sid,r.student_id,r.status,u.id));
      stmts.push(env.DB.prepare("INSERT INTO audit_logs(user_id,action,target_type,target_id,new_values) VALUES(?,?,?,?,?)").bind(u.id,"ATTENDANCE_SUBMITTED","attendance_session",sid,JSON.stringify({class_id:b.class_id,date:b.date,count:b.records.length})));
      try{await env.DB.batch(stmts)}catch(e){if(String(e).includes("UNIQUE"))return out({error:"attendance_already_submitted"},409);throw e}return out({ok:true,session_id:sid},201);
    }
    if(p==="/api/dashboard/today"&&req.method==="GET"){
      if(u.role!=="SECTION_HEAD")return out({error:"forbidden"},403);const date=url.searchParams.get("date")||new Date().toISOString().slice(0,10);
      const r=await env.DB.prepare(`SELECT c.id class_id,c.display_name,s.id session_id,s.submitted_at,COUNT(ar.id) total,SUM(CASE WHEN ar.status='PRESENT' THEN 1 ELSE 0 END) present,SUM(CASE WHEN ar.status='ABSENT' THEN 1 ELSE 0 END) absent,SUM(CASE WHEN ar.status='LATE' THEN 1 ELSE 0 END) late FROM classes c LEFT JOIN attendance_sessions s ON s.class_id=c.id AND s.attendance_date=? LEFT JOIN attendance_records ar ON ar.session_id=s.id WHERE c.is_active=1 GROUP BY c.id,c.display_name,s.id,s.submitted_at ORDER BY c.display_name`).bind(date).all();return out({date,classes:r.results});
    }
    return out({error:"not_found"},404);
  }catch(e){console.error(e);return out({error:"internal_server_error"},500)}
}};