# Security checklist

- Keep Supabase service-role keys server-side only; clients use the public anon key.
- Require HTTPS and strong unique passwords; enable MFA for Section Head accounts when available.
- RLS is enabled on every student-data table. Never disable it to solve a client error.
- Use RPC functions for submission and correction so validation, constraints and audit writes occur in one transaction.
- Do not permanently delete students with attendance history; deactivate them.
- Review audit logs regularly and limit correction rights.
- Avoid real student information in issues, screenshots, logs and demo seeds.
- Configure backups, restore tests, retention and incident response before production rollout.
- Rotate leaked credentials immediately and invalidate affected sessions.

