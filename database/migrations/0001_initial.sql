begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('SECTION_HEAD', 'TEACHER');
create type public.attendance_status as enum ('PRESENT', 'ABSENT', 'LATE');
create type public.session_status as enum ('DRAFT', 'SUBMITTED');
create type public.day_type as enum ('SCHOOL_DAY', 'WEEKEND', 'HOLIDAY', 'SPECIAL_HOLIDAY', 'SPECIAL_SCHOOL_DAY');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  is_current boolean not null default false
);
create unique index one_current_academic_year on public.academic_years(is_current) where is_current;

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grades(id),
  name text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (grade_id, name),
  unique (display_name)
);

create table public.teacher_class_assignments (
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id),
  is_active boolean not null default true,
  primary key (teacher_id, class_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  admission_number text not null unique,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  class_id uuid not null references public.classes(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_class_active_idx on public.students(class_id, is_active);
create index students_name_search_idx on public.students(lower(full_name));

create table public.student_class_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  from_class_id uuid references public.classes(id),
  to_class_id uuid not null references public.classes(id),
  transferred_by uuid not null references public.profiles(id),
  transferred_at timestamptz not null default now(),
  reason text
);

create table public.school_days (
  day date primary key,
  day_type public.day_type not null,
  label text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  attendance_date date not null,
  status public.session_status not null default 'SUBMITTED',
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, attendance_date)
);
create index attendance_sessions_date_idx on public.attendance_sessions(attendance_date, class_id);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  status public.attendance_status not null,
  marked_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index attendance_records_student_idx on public.attendance_records(student_id, session_id);

create table public.attendance_changes (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references public.attendance_records(id) on delete restrict,
  old_status public.attendance_status not null,
  new_status public.attendance_status not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default now(),
  reason text
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.academic_years(name, starts_on, ends_on, is_current)
values ('2026', '2026-01-01', '2026-12-31', true);
insert into public.grades(name, sort_order) values ('10', 10), ('11', 11);
insert into public.classes(grade_id, name, display_name)
select g.id, s.letter, g.name || '-' || s.letter
from public.grades g cross join (values ('A'),('B'),('C'),('D'),('E')) s(letter);
insert into public.system_settings(key, value) values
  ('attendance_threshold', '80'::jsonb),
  ('school_timezone', '"Asia/Colombo"'::jsonb),
  ('teacher_correction_allowed', 'false'::jsonb);

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from profiles where id = auth.uid() and is_active) $$;

create or replace function public.is_section_head() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from profiles where id = auth.uid() and role = 'SECTION_HEAD' and is_active) $$;

create or replace function public.can_access_class(target_class uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_section_head() or exists(
    select 1 from teacher_class_assignments
    where teacher_id = auth.uid() and class_id = target_class and is_active
  )
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger students_touch before update on public.students for each row execute function public.touch_updated_at();
create trigger attendance_sessions_touch before update on public.attendance_sessions for each row execute function public.touch_updated_at();

create or replace function public.submit_attendance(p_class_id uuid, p_date date, p_records jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_session uuid;
  v_expected integer;
  v_received integer;
begin
  if not public.is_active_user() or not public.can_access_class(p_class_id) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
  if p_date > current_date then raise exception 'future_date_not_allowed'; end if;
  if exists(select 1 from school_days where day=p_date and day_type in ('WEEKEND','HOLIDAY','SPECIAL_HOLIDAY')) then
    raise exception 'not_a_school_day';
  end if;
  if jsonb_typeof(p_records) <> 'array' then raise exception 'records_must_be_array'; end if;
  select count(*) into v_expected from students where class_id=p_class_id and is_active;
  select count(distinct (x->>'student_id')) into v_received from jsonb_array_elements(p_records) x;
  if v_expected = 0 or v_received <> v_expected then raise exception 'incomplete_register'; end if;
  if exists(
    select 1 from jsonb_array_elements(p_records) x
    left join students s on s.id=(x->>'student_id')::uuid
    where s.id is null or s.class_id<>p_class_id or not s.is_active
      or x->>'status' not in ('PRESENT','ABSENT','LATE')
  ) then raise exception 'invalid_student_or_status'; end if;

  insert into attendance_sessions(class_id, attendance_date, submitted_by)
  values (p_class_id, p_date, auth.uid()) returning id into v_session;
  insert into attendance_records(session_id, student_id, status, marked_by)
  select v_session, (x->>'student_id')::uuid, (x->>'status')::attendance_status, auth.uid()
  from jsonb_array_elements(p_records) x;
  insert into audit_logs(user_id, action, target_type, target_id, new_values)
  values(auth.uid(), 'ATTENDANCE_SUBMITTED', 'attendance_session', v_session::text,
    jsonb_build_object('class_id',p_class_id,'date',p_date,'count',v_received));
  return v_session;
exception when unique_violation then
  raise exception 'attendance_already_submitted' using errcode = '23505';
end $$;

create or replace function public.correct_attendance(p_record_id uuid, p_new_status public.attendance_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_old public.attendance_status; v_class uuid;
begin
  select r.status, s.class_id into v_old, v_class
  from attendance_records r join attendance_sessions s on s.id=r.session_id
  where r.id=p_record_id for update;
  if v_old is null then raise exception 'record_not_found'; end if;
  if not public.is_section_head() and not (
    public.can_access_class(v_class) and coalesce((select (value #>> '{}')::boolean from system_settings where key='teacher_correction_allowed'),false)
  ) then raise exception 'permission_denied' using errcode='42501'; end if;
  if v_old = p_new_status then return; end if;
  update attendance_records set status=p_new_status, marked_by=auth.uid(), updated_at=now() where id=p_record_id;
  insert into attendance_changes(attendance_record_id,old_status,new_status,changed_by,reason)
  values(p_record_id,v_old,p_new_status,auth.uid(),nullif(trim(p_reason),''));
  insert into audit_logs(user_id,action,target_type,target_id,old_values,new_values)
  values(auth.uid(),'ATTENDANCE_CHANGED','attendance_record',p_record_id::text,
    jsonb_build_object('status',v_old),jsonb_build_object('status',p_new_status,'reason',p_reason));
end $$;

create or replace function public.transfer_student(p_student_id uuid, p_to_class_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_from uuid;
begin
  if not public.is_section_head() then raise exception 'permission_denied' using errcode='42501'; end if;
  select class_id into v_from from students where id=p_student_id for update;
  if v_from is null then raise exception 'student_not_found'; end if;
  if v_from=p_to_class_id then return; end if;
  update students set class_id=p_to_class_id where id=p_student_id;
  insert into student_class_history(student_id,from_class_id,to_class_id,transferred_by,reason)
  values(p_student_id,v_from,p_to_class_id,auth.uid(),p_reason);
  insert into audit_logs(user_id,action,target_type,target_id,old_values,new_values)
  values(auth.uid(),'STUDENT_TRANSFERRED','student',p_student_id::text,
    jsonb_build_object('class_id',v_from),jsonb_build_object('class_id',p_to_class_id,'reason',p_reason));
end $$;

create or replace view public.daily_class_summary with (security_invoker=true) as
select c.id class_id, c.display_name, s.attendance_date, s.id session_id, s.submitted_at,
 count(r.id)::int total,
 count(r.id) filter(where r.status='PRESENT')::int present,
 count(r.id) filter(where r.status='ABSENT')::int absent,
 count(r.id) filter(where r.status='LATE')::int late,
 round(100.0 * count(r.id) filter(where r.status in ('PRESENT','LATE')) / nullif(count(r.id),0),1) attendance_percentage
from classes c left join attendance_sessions s on s.class_id=c.id
left join attendance_records r on r.session_id=s.id
group by c.id,c.display_name,s.attendance_date,s.id,s.submitted_at;

alter table public.profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.grades enable row level security;
alter table public.classes enable row level security;
alter table public.teacher_class_assignments enable row level security;
alter table public.students enable row level security;
alter table public.student_class_history enable row level security;
alter table public.school_days enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_changes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

create policy profiles_read_self_or_admin on public.profiles for select using (id=auth.uid() or public.is_section_head());
create policy profiles_admin_write on public.profiles for all using (public.is_section_head()) with check (public.is_section_head());
create policy reference_read on public.grades for select using (public.is_active_user());
create policy class_read on public.classes for select using (public.is_active_user() and public.can_access_class(id));
create policy years_read on public.academic_years for select using (public.is_active_user());
create policy assignments_read on public.teacher_class_assignments for select using (teacher_id=auth.uid() or public.is_section_head());
create policy assignments_admin_write on public.teacher_class_assignments for all using (public.is_section_head()) with check (public.is_section_head());
create policy students_read on public.students for select using (public.is_active_user() and public.can_access_class(class_id));
create policy students_admin_write on public.students for all using (public.is_section_head()) with check (public.is_section_head());
create policy history_admin_read on public.student_class_history for select using (public.is_section_head());
create policy calendar_read on public.school_days for select using (public.is_active_user());
create policy calendar_admin_write on public.school_days for all using (public.is_section_head()) with check (public.is_section_head());
create policy sessions_read on public.attendance_sessions for select using (public.is_active_user() and public.can_access_class(class_id));
create policy records_read on public.attendance_records for select using (exists(select 1 from attendance_sessions s where s.id=session_id and public.can_access_class(s.class_id)));
create policy changes_admin_read on public.attendance_changes for select using (public.is_section_head());
create policy audit_admin_read on public.audit_logs for select using (public.is_section_head());
create policy settings_read on public.system_settings for select using (public.is_active_user());
create policy settings_admin_write on public.system_settings for all using (public.is_section_head()) with check (public.is_section_head());

revoke insert,update,delete on public.attendance_sessions,public.attendance_records,public.attendance_changes,public.audit_logs from authenticated;
grant execute on function public.submit_attendance(uuid,date,jsonb) to authenticated;
grant execute on function public.correct_attendance(uuid,public.attendance_status,text) to authenticated;
grant execute on function public.transfer_student(uuid,uuid,text) to authenticated;

commit;

