export const schoolTimezone=import.meta.env.VITE_SCHOOL_TIMEZONE||'Asia/Colombo'
export function schoolDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:schoolTimezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function prettyDate(date:string){return new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeZone:schoolTimezone}).format(new Date(`${date}T12:00:00Z`))}

