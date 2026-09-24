const API_BASE=(import.meta.env.VITE_API_URL||'https://school-attendance-api.azeemzahira111.workers.dev').replace(/\/$/,'')
export type ApiUser={id:string;full_name:string;username:string;role:'SECTION_HEAD'|'TEACHER';is_active?:boolean}
export function getToken(){return localStorage.getItem('school_attendance_token')}
export function setToken(token:string|null){if(token)localStorage.setItem('school_attendance_token',token);else localStorage.removeItem('school_attendance_token')}
export async function api<T=any>(path:string,options:RequestInit={}):Promise<T>{
 const token=getToken()
 const headers=new Headers(options.headers)
 if(options.body&&!headers.has('content-type'))headers.set('content-type','application/json')
 if(token)headers.set('authorization',`Bearer ${token}`)
 const res=await fetch(`${API_BASE}${path}`,{...options,headers})
 let data:any={};try{data=await res.json()}catch{}
 if(!res.ok){if(res.status===401)setToken(null);throw new Error(data.error||`request_failed_${res.status}`)}
 return data as T
}
export async function login(username:string,password:string){const data=await api<{token:string;user:ApiUser}>('/api/auth/login',{method:'POST',body:JSON.stringify({username,password})});setToken(data.token);return data.user}
export async function logout(){try{if(getToken())await api('/api/auth/logout',{method:'POST'})}finally{setToken(null)}}
