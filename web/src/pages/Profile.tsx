import {useEffect,useMemo,useRef,useState} from 'react'
import {Camera,Crop,LogOut,Trash2,UserRound,X} from 'lucide-react'
import {api} from '../lib/api'
import {useAuth} from '../AuthContext'
import {clearLegacyProfilePhoto,getProfilePhoto,removeProfilePhoto,setProfilePhoto} from '../lib/profilePhoto'

type CropInfo={src:string;width:number;height:number}

export function Profile(){
 const auth=useAuth(),profile=auth.profile
 const [name,setName]=useState(profile?.full_name||''),[photo,setPhoto]=useState(()=>getProfilePhoto(profile?.id)),[msg,setMsg]=useState('')
 const [crop,setCrop]=useState<CropInfo|null>(null),[zoom,setZoom]=useState(1),[panX,setPanX]=useState(0),[panY,setPanY]=useState(0),[savingCrop,setSavingCrop]=useState(false)
 const inputRef=useRef<HTMLInputElement>(null)

 useEffect(()=>setName(profile?.full_name||''),[profile?.full_name])
 useEffect(()=>{clearLegacyProfilePhoto();setPhoto(getProfilePhoto(profile?.id))},[profile?.id])

 const cropMetrics=useMemo(()=>{
  if(!crop)return null
  const size=260,base=Math.max(size/crop.width,size/crop.height),scale=base*zoom,w=crop.width*scale,h=crop.height*scale
  return{size,scale,w,h,maxX:Math.max(0,(w-size)/2),maxY:Math.max(0,(h-size)/2)}
 },[crop,zoom])

 async function choose(e:React.ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];e.target.value=''
  if(!file)return
  if(!file.type.startsWith('image/')){setMsg('Please choose an image file.');return}
  const src=URL.createObjectURL(file),img=new Image()
  img.onload=()=>{setCrop({src,width:img.naturalWidth,height:img.naturalHeight});setZoom(1);setPanX(0);setPanY(0);setMsg('')}
  img.onerror=()=>{URL.revokeObjectURL(src);setMsg('Could not open that image. Please choose another photo.')}
  img.src=src
 }

 async function saveCrop(){
  if(!crop||!cropMetrics)return
  setSavingCrop(true)
  try{
   const img=new Image()
   await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('image'));img.src=crop.src})
   const {size,scale,w,h,maxX,maxY}=cropMetrics,x=panX*maxX,y=panY*maxY,left=(size-w)/2+x,top=(size-h)/2+y
   const sx=Math.max(0,-left/scale),sy=Math.max(0,-top/scale),sw=Math.min(crop.width-sx,size/scale),sh=Math.min(crop.height-sy,size/scale)
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas')
   ctx.fillStyle='#fff';ctx.fillRect(0,0,512,512);ctx.drawImage(img,sx,sy,sw,sh,0,0,512,512)
   const v=canvas.toDataURL('image/jpeg',0.86)
   if(!profile?.id)throw new Error('profile_missing');setProfilePhoto(profile.id,v);setPhoto(v);window.dispatchEvent(new CustomEvent('profile-photo-changed',{detail:{userId:profile.id}}))
   URL.revokeObjectURL(crop.src);setCrop(null);setMsg('Profile picture updated ✓')
  }catch{setMsg('Could not crop this image. Please try another photo.')}
  finally{setSavingCrop(false)}
 }

 function cancelCrop(){if(crop)URL.revokeObjectURL(crop.src);setCrop(null)}
 function removePhoto(){if(!photo)return;if(!confirm('Remove your profile picture?'))return;if(!profile?.id)return;removeProfilePhoto(profile.id);setPhoto('');window.dispatchEvent(new CustomEvent('profile-photo-changed',{detail:{userId:profile.id}}));setMsg('Profile picture removed ✓')}
 async function save(e:React.FormEvent){e.preventDefault();setMsg('');try{const d=await api<{user:any}>('/api/profile',{method:'PUT',body:JSON.stringify({full_name:name})});auth.setProfile(d.user);setMsg('Profile updated ✓')}catch(err){setMsg(err instanceof Error?err.message:'Could not update profile.')}}

 return <>
  <section className="profile-hero"><div className="profile-photo">{photo?<img src={photo} alt="Profile"/>:<UserRound/>}</div><h2>{profile?.full_name}</h2><p>{profile?.role==='SECTION_HEAD'?'Section Head':'Class Teacher'}</p><small>@{profile?.username}</small></section>
  <section className="profile-card">
   <input ref={inputRef} type="file" accept="image/*" onChange={choose} hidden/>
   <div className="profile-photo-actions">
    <button className="secondary" type="button" onClick={()=>inputRef.current?.click()}><Camera size={17}/>{photo?'Change Profile Picture':'Add Profile Picture'}</button>
    {photo&&<button className="remove-photo" type="button" onClick={removePhoto}><Trash2 size={17}/> Remove Picture</button>}
   </div>
   <small className="profile-photo-note">Choose a photo, crop it to a square, then save it.</small>
   <form onSubmit={save} className="profile-form"><label>Name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Username<input value={profile?.username||''} readOnly disabled/><small>Username cannot be changed.</small></label><button className="primary" type="submit">Save Changes</button></form>
   {msg&&<div className={msg.includes('✓')?'notice':'error'}>{msg}</div>}
  </section>
  <button className="profile-logout" type="button" onClick={()=>auth.signOut()}><LogOut size={18}/> Logout</button>

  {crop&&cropMetrics&&<div className="crop-modal-backdrop">
   <section className="crop-modal">
    <div className="crop-head"><div><Crop size={19}/><strong>Crop Profile Picture</strong></div><button onClick={cancelCrop} aria-label="Close crop"><X/></button></div>
    <div className="crop-stage">
     <img src={crop.src} alt="Crop preview" style={{width:cropMetrics.w,height:cropMetrics.h,transform:`translate(-50%,-50%) translate(${panX*cropMetrics.maxX}px,${panY*cropMetrics.maxY}px)`}}/>
     <div className="crop-mask"/>
    </div>
    <div className="crop-controls">
     <label>Zoom <input type="range" min="1" max="3" step=".05" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label>
     {cropMetrics.maxX>1&&<label>Horizontal <input type="range" min="-1" max="1" step=".02" value={panX} onChange={e=>setPanX(Number(e.target.value))}/></label>}
     {cropMetrics.maxY>1&&<label>Vertical <input type="range" min="-1" max="1" step=".02" value={panY} onChange={e=>setPanY(Number(e.target.value))}/></label>}
    </div>
    <div className="crop-actions"><button className="secondary" onClick={cancelCrop}>Cancel</button><button className="primary" onClick={saveCrop} disabled={savingCrop}>{savingCrop?'Saving…':'Save Crop'}</button></div>
   </section>
  </div>}
 </>
}