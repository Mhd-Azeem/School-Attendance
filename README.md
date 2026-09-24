# School Attendance Management System

A shared attendance platform for Grade 10 and Grade 11. Teachers use a focused attendance portal; the Section Head sees every class, submissions, students, teachers, reports and audit history. The React PWA and Android app use the same Supabase authentication and PostgreSQL database.

## Current baseline

- Supabase PostgreSQL schema with row-level security and backend-enforced teacher/class access
- Transactional attendance submission with one session per class/date
- Immutable attendance change history and administrative audit log
- React + TypeScript responsive PWA with teacher and Section Head portals
- Offline-safe local attendance drafts; success is shown only after server confirmation
- Kotlin + Jetpack Compose Android client foundation using the same Supabase project
- CSV student import validation, report CSV export, school calendar and configurable low-attendance threshold
- GitHub Actions for web tests/build, database lint checks and Android APK build artifacts

## Architecture

```text
web/PWA (React) ─┐
                 ├─ Supabase Auth + PostgREST/RPC + PostgreSQL
Android (Kotlin) ┘                         │
                              RLS, constraints, audit triggers
```

Public clients receive only the Supabase **anon** key. Authorization is enforced by database RLS and security-definer RPC functions. The service-role key must never be placed in either client.

## Repository

```text
/web       React/TypeScript PWA
/android   Kotlin/Jetpack Compose Android app
/database  SQL migrations and database tests
/docs      setup, rollout and security notes
/scripts   local verification helpers
```

## Local setup

1. Create a Supabase project and set its region close to Sri Lanka.
2. Run `database/migrations/0001_initial.sql` in the Supabase SQL editor.
3. Create the first Section Head account in Supabase Authentication.
4. In SQL, insert its profile using the authenticated user's UUID (instructions are in `docs/SETUP.md`).
5. Copy `.env.example` to `web/.env.local` and fill in the public URL and anon key.
6. Run the web application:

```bash
cd web
npm ci
npm run dev
```

## Build

```bash
cd web && npm ci && npm test && npm run build
cd android && ./gradlew testDebugUnitTest assembleDebug
```

The web build is written to `web/dist`. Android debug APK output is under `android/app/build/outputs/apk/debug/`. CI uploads the APK as a workflow artifact.

## Deployment

- Web: deploy `web/dist` to Cloudflare Pages, Netlify, Vercel, or another HTTPS static host. Configure SPA fallback to `index.html`.
- Android: add repository secrets/variables described in `docs/SETUP.md`, run the Android workflow, pilot the artifact, and only then create a signed release.
- Database: apply numbered migrations in order and enable Supabase point-in-time recovery or scheduled backups before production use.

## Rollout

Use fictional data first, verify Teacher and Section Head permissions, pilot one class, correct any workflow issues, then import all ten classes. See `docs/ROLLOUT.md`.

## Security

Do not commit student exports, real passwords, `.env` files, service-role keys, signing stores or `local.properties`. Review `docs/SECURITY.md` before real student data is imported.

