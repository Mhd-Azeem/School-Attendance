# Setup

## Supabase

1. Create a new project and retain the project URL and public anon key.
2. Open SQL Editor and run `database/migrations/0001_initial.sql`.
3. In Authentication, create the Section Head user.
4. Copy the user's UUID and run:

```sql
insert into public.profiles (id, full_name, role, is_active)
values ('AUTH-USER-UUID', 'Section Head', 'SECTION_HEAD', true);
```

Teacher onboarding is two-step: create an Auth user, then insert/update its `profiles` row with role `TEACHER`; finally add rows to `teacher_class_assignments`. Never share passwords in source code.

## Web/PWA

Copy `.env.example` to `web/.env.local`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_SCHOOL_TIMEZONE=Asia/Colombo`.

For production hosting, configure all unknown paths to serve `/index.html`, HTTPS, and these environment variables. The service worker is generated during the Vite build.

## Android

Create `android/local.properties`:

```properties
sdk.dir=/path/to/Android/sdk
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

For CI, add repository variables `SUPABASE_URL` and `SUPABASE_ANON_KEY`. For a signed Play-independent release, add base64 signing material only through GitHub Actions secrets; never commit the keystore.

## Backups

Enable managed backups. Before a migration, take a fresh backup and test restore procedures in a non-production project. Export configuration and schema separately from student data.

