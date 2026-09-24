# School Attendance

Attendance system for Grade 10 and Grade 11 (A-E), with Teacher and Section Head portals.

## Current starter
- Responsive installable PWA for Android/iPhone/desktop
- Teacher attendance screen: Present / Absent / Late, Mark All Present, Submit
- Section Head dashboard for all 10 classes
- Offline app shell
- PostgreSQL/Supabase-ready schema
- Android project + CI scaffold

The web UI currently uses local demo data so it can run immediately. Before real student use, connect authentication/data operations to Supabase and add complete RLS policies. **Do not use real student records until server-side authorization is enabled and tested.**

## Run web
Serve the repository root with any static web server. GitHub Pages workflow deploys it automatically.

## Database
Create a Supabase project, run `database/schema.sql`, then implement and test RLS policies for Section Head vs assigned teachers. Never expose a service-role key in the browser or APK.

## Android
The Android module is a lightweight WebView shell. Set `APP_URL` in `android/app/build.gradle.kts` to the deployed HTTPS PWA URL before release.

## Roadmap
1. Supabase auth + strict RLS
2. Real student/teacher management and CSV import
3. Attendance audit/corrections
4. Reports/PDF/CSV
5. School calendar and low-attendance alerts
6. Robust offline sync/conflict handling
7. Production security testing
