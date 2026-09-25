import {useEffect,useState} from 'react'
import {UserRound} from 'lucide-react'
import {api} from '../lib/api'
import {useAuth} from '../AuthContext'
export function Profile(){
 const auth:any=useAuth(), profile=auth.profile
 const [name,setName]=useState(profile?.full_name||'')
 const [photo,setPhoto]=useState(()=>localStorage.getItem('school_attendance_profile_photo')||'')
 const [msg,setMsg]=useState('')
 useEffect(()=>setName(profile?.full_name||''),[profile?.full_name])
 function choose(e:any){const file=e.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){setMsg('Choose an image smaller than 2 MB.');return}const r=new FileReader();r.onload=()=>{const v=String(r.result);localStorage.setItem('school_attendance_profile_photo',v);setPhoto(v);setMsg('Profile picture updated.')};r.readAsDataURL(file)}
 async function save(e:any){e.preventDefault();setMsg('');try{const d:any=await api('/api/profile',{method:'PUT',body:JSON.stringify({full_name:name})});auth.setProfile?.(d.user);setMsg('Profile updated.')}catch(err:any){setMsg(err.message||'Could not update profile.')}}
 return <section><div className="page-title"><div><h1>Profile</h1><p>Manage your account information.</p></div></div><div className="profile-card"><div className="profile-photo">{photo?<img src={photo} alt="Profile"/>:<UserRound/>}</div><label className="secondary profile-photo-button">Change profile picture<input type="file" accept="image/*" onChange={choose} hidden/></label><form onSubmit={save} className="profile-form"><label>Name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Username<input value={profile?.username||''} readOnly disabled/><small>Username cannot be changed.</small></label><button className="primary" type="submit">Save changes</button></form>{msg&&<div className="notice">{msg}</div>}</div></section>
}