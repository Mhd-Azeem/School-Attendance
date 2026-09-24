-- Run against a disposable Supabase test project after applying migrations.
-- These invariant checks fail loudly when schema protections are missing.
do $$ begin
  assert exists(select 1 from pg_constraint where conname='attendance_sessions_class_id_attendance_date_key'),
    'class/date uniqueness missing';
  assert exists(select 1 from pg_constraint where conname='attendance_records_session_id_student_id_key'),
    'session/student uniqueness missing';
  assert (select relrowsecurity from pg_class where oid='public.students'::regclass), 'students RLS disabled';
  assert (select relrowsecurity from pg_class where oid='public.attendance_records'::regclass), 'attendance RLS disabled';
  assert (select count(*) from public.classes)=10, 'ten initial classes not seeded';
end $$;

