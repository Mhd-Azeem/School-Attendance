# Cloudflare backend

This backend replaces the previous Supabase backend plan.

## Stack
- Cloudflare Workers: API/auth/authorization
- Cloudflare D1: relational database
- Worker binding: `DB` -> `school-attendance-db`

## Deploy database
From `backend/`:
```bash
npm ci
npx wrangler d1 migrations apply school-attendance-db --remote
```

## Deploy Worker
```bash
npm run deploy
```

## First Section Head
After migration, call `GET /api/setup/status`. If `needs_section_head` is true, make one POST to `/api/setup/section-head` with `full_name`, `email`, and a password of at least 10 characters. The bootstrap endpoint locks itself after the first Section Head exists.

Never commit real passwords or session tokens.
