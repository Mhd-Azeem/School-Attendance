import {useEffect,useState} from 'react'
import {LogOut,UserRound} from 'lucide-react'
import {api} from '../lib/api'
import {useAuth} from '../AuthContext'
export function Profile(){
 const auth=useAuth(),profile=auth.profile
 const [name,setName]=useState(profile?.full_name||''),[photo,setPhoto]=useState(()=>localStorage.getItem('school_attendance_profile_photo')||''),[msg,setMsg]=useState('')
 useEffect(()=>setName(profile?.full_name||''),[profile?.full_name])
 function choose(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){setMsg('Choose an image smaller than 2 MB.');return}const r=new FileReader();r.onload=()=>{const v=String(r.result);localStorage.setItem('school_attendance_profile_photo',v);setPhoto(v);setMsg('Profile picture updated ✓')};r.readAsDataURL(file)}
 async function save(e:React.FormEvent){e.preventDefault();setMsg('');try{const d=await api<{user:any}>('/api/profile',{method:'PUT',body:JSON.stringify({full_name:name})});auth.setProfile(d.user);setMsg('Profile updated ✓')}catch(err){setMsg(err instanceof Error?err.message:'Could not update profile.')}}
 return <><section className="profile-hero"><div className="profile-photo">{photo?<img src={photo} alt="Profile"/>:<UserRound/>}</div><h2>{profile?.full_name}</h2><p>{profile?.role==='SECTION_HEAD'?'Section Head':'Class Teacher'}</p><small>@{profile?.username}</small></section><section className="profile-card"><label className="secondary profile-photo-button">Change Profile Picture<input type="file" accept="image/*" onChange={choose} hidden/></label><form onSubmit={save} className="profile-form"><label>Name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Username<input value={profile?.username||''} readOnly disabled/><small>Username cannot be changed.</small></label><button className="primary" type="submit">Save Changes</button></form>{msg&&<div className={msg.includes('✓')?'notice':'error'}>{msg}</div>}</section><button className="profile-logout" type="button" onClick={()=>auth.signOut()}><LogOut size={18}/> Logout</button></>
}