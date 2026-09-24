import { createContext,useContext,useEffect,useState,type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Profile } from './types'

interface AuthState {session:Session|null;profile:Profile|null;loading:boolean;signOut:()=>Promise<void>}
const AuthContext=createContext<AuthState>({session:null,profile:null,loading:true,signOut:async()=>{}})
export function AuthProvider({children}:{children:ReactNode}){
 const [session,setSession]=useState<Session|null>(null),[profile,setProfile]=useState<Profile|null>(null),[loading,setLoading]=useState(true)
 useEffect(()=>{let active=true
  const load=async(s:Session|null)=>{setSession(s);if(!s){setProfile(null);setLoading(false);return}
   const {data,error}=await supabase.from('profiles').select('id,full_name,role,is_active').eq('id',s.user.id).single()
   if(!active)return;if(error||!data?.is_active){await supabase.auth.signOut();setProfile(null)}else setProfile(data as Profile);setLoading(false)}
  supabase.auth.getSession().then(({data})=>load(data.session))
  const {data:listener}=supabase.auth.onAuthStateChange((_e,s)=>load(s));return()=>{active=false;listener.subscription.unsubscribe()}
 },[])
 return <AuthContext.Provider value={{session,profile,loading,signOut:async()=>{await supabase.auth.signOut()}}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)

