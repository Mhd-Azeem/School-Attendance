import {createContext,useContext,useEffect,useState,type ReactNode} from 'react'
import {api,getToken,login as apiLogin,logout as apiLogout,type ApiUser} from './lib/api'
import type {Profile} from './types'
interface AuthState{session:string|null;profile:Profile|null;loading:boolean;login:(username:string,password:string)=>Promise<void>;signOut:()=>Promise<void>;setProfile:(p:Profile|null)=>void}
const AuthContext=createContext<AuthState>({session:null,profile:null,loading:true,login:async()=>{},signOut:async()=>{},setProfile:()=>{}})
export function AuthProvider({children}:{children:ReactNode}){
 const [session,setSession]=useState<string|null>(getToken()),[profile,setProfile]=useState<Profile|null>(null),[loading,setLoading]=useState(true)
 useEffect(()=>{let active=true;(async()=>{const token=getToken();if(!token){if(active){setSession(null);setLoading(false)}return}try{const {user}=await api<{user:ApiUser}>('/api/auth/me');if(active){setProfile({...user,is_active:true});setSession(token)}}catch{if(active){setProfile(null);setSession(null)}}finally{if(active)setLoading(false)}})();return()=>{active=false}},[])
 async function login(username:string,password:string){const user=await apiLogin(username,password);setSession(getToken());setProfile({...user,is_active:true})}
 async function signOut(){await apiLogout();setSession(null);setProfile(null)}
 return <AuthContext.Provider value={{session,profile,loading,login,signOut,setProfile}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)
