#!/usr/bin/env bash
set -euo pipefail
schema="database/migrations/0001_initial.sql"
test -f "$schema"
for required in \
  "enable row level security" \
  "unique (class_id, attendance_date)" \
  "unique (session_id, student_id)" \
  "create or replace function public.submit_attendance" \
  "create or replace function public.correct_attendance" \
  "create table public.attendance_changes" \
  "create table public.audit_logs"
do
  grep -Fqi "$required" "$schema" || { echo "Missing schema protection: $required"; exit 1; }
done
if rg -i '(service_role|password[[:space:]]*=[[:space:]]*[^$])' .env.example web/src android/app/src database; then
  echo "Possible committed secret detected"; exit 1
fi
echo "Schema protection checks passed"
