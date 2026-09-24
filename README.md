# School Attendance Management System

A shared attendance platform for Grade 10 and Grade 11. Teachers use a focused attendance portal; the Section Head sees all ten classes, submissions, students, teachers, reports and audit history.

## Backend architecture

The project now uses **Cloudflare Workers + Cloudflare D1** instead of Supabase.

```text
Web/PWA ─┐
         ├── Cloudflare Worker API ── D1 (school-attendance-db)
Android ─┘
```

The Worker is the security boundary. Browser and Android clients must never access D1 directly. Teacher/class authorization is checked by the Worker API.

## Repository

```text
/web       React/TypeScript PWA
/android   Android app
/backend   Cloudflare Worker, Wrangler config and D1 migrations
/database  legacy Supabase/PostgreSQL files kept temporarily for reference
/docs      setup, rollout and security notes
```

## Cloudflare backend

The Worker is named `school-attendance-api` and expects this binding:

```text
DB -> school-attendance-db
```

The D1 configuration is in `backend/wrangler.jsonc`.

### Apply the D1 migration

```bash
cd backend
npm install
npx wrangler login
npx wrangler d1 migrations apply school-attendance-db --remote
```

The migration creates the users, sessions, grades, ten classes (10-A to 10-E and 11-A to 11-E), students, teacher assignments, attendance, school calendar, settings and audit tables.

### Deploy the Worker

```bash
cd backend
npm run deploy
```

Test:

```text
GET https://<your-worker>.workers.dev/api/health
```

It should return an OK response identifying D1.

## Initial Section Head

After the D1 migration is applied, check:

```text
GET /api/setup/status
```

If initial setup is required, create the first Section Head through the bootstrap endpoint documented in `backend/README.md`. The endpoint refuses further bootstrap creation after a Section Head exists.

## Security

- Never commit real passwords or session tokens.
- Passwords are stored as derived hashes, not plaintext.
- D1 is reachable only through the Worker binding.
- Teacher access must be checked against `teacher_class_assignments`.
- Do not import real student data until authentication and authorization tests pass.
- The old Supabase files under `database/` are not the production backend.

## Next integration stage

The existing web/PWA still needs its Supabase/local demo data layer replaced with calls to the Cloudflare Worker API. Once the Worker and D1 migration are deployed successfully, connect the web and Android clients to the Worker URL.
