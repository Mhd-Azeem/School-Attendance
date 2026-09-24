import type { Draft } from '../types'
const key=(classId:string,date:string)=>`attendance-draft:${classId}:${date}`
export const saveDraft=(draft:Draft)=>localStorage.setItem(key(draft.classId,draft.date),JSON.stringify(draft))
export const loadDraft=(classId:string,date:string):Draft|null=>{try{return JSON.parse(localStorage.getItem(key(classId,date))||'null')}catch{return null}}
export const clearDraft=(classId:string,date:string)=>localStorage.removeItem(key(classId,date))

