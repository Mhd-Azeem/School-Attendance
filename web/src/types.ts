export type Role = 'SECTION_HEAD' | 'TEACHER'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'
export interface Profile { id:string; full_name:string; role:Role; is_active:boolean }
export interface SchoolClass { id:string; display_name:string; grade_id:string }
export interface Student { id:string; admission_number:string; full_name:string; class_id:string; is_active:boolean }
export interface DailySummary { class_id:string; display_name:string; attendance_date:string|null; session_id:string|null; submitted_at:string|null; total:number; present:number; absent:number; late:number; attendance_percentage:number|null }
export interface Draft { classId:string; date:string; statuses:Record<string,AttendanceStatus>; updatedAt:string }

