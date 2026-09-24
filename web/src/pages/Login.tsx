import { useState,type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../AuthContext'
export function Login(){const {session}=useAuth();const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[reset,setReset]=useState(false)
 if(session)return <Navigate to="/" replace/>
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');const result=reset?await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin}):await supabase.auth.signInWithPassword({email,password});if(result.error)setError(result.error.message);else if(reset)setError('Password-reset email sent.');setBusy(false)}
 return <div className="login-page"><section className="login-card"><div className="crest">SA</div><h1>School Attendance</h1><p>{reset?'Enter your account email to reset your password.':'Sign in to your secure portal.'}</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username"/></label>{!reset&&<label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>} {error&&<div className={error.includes('sent')?'notice':'error'}>{error}</div>}<button className="primary" disabled={busy}>{busy?'Please wait…':reset?'Send reset link':'Sign in'}</button></form><button className="link" onClick={()=>{setReset(!reset);setError('')}}>{reset?'Back to sign in':'Forgot password?'}</button></section></div>}

