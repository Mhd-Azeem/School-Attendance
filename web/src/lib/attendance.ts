import type { AttendanceStatus } from '../types'
export function totals(statuses:Partial<Record<string,AttendanceStatus>>){
  return Object.values(statuses).reduce((a,s)=>{
    if(!s)return a
    if(s==='PRESENT')a.present+=1
    else if(s==='ABSENT')a.absent+=1
    else if(s==='LATE')a.late+=1
    return a
  },{present:0,absent:0,late:0})
}
export const percentage=(present:number,late:number,total:number)=>total?Math.round(((present+late)/total)*1000)/10:0
