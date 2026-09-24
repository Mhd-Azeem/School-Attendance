import type { AttendanceStatus } from '../types'
export function totals(statuses:Record<string,AttendanceStatus>){
  return Object.values(statuses).reduce((a,s)=>({...a,[s.toLowerCase()]:a[s.toLowerCase() as 'present'|'absent'|'late']+1}),{present:0,absent:0,late:0})
}
export const percentage=(present:number,late:number,total:number)=>total?Math.round(((present+late)/total)*1000)/10:0

