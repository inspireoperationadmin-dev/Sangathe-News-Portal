# Milestone 1 — Secure Newsroom Foundation

This milestone implements the RFP's core newsroom workflow and security foundation. AI assistance and advertising are excluded from Phase 1.

## RFP coverage

- Section 6: draft, review, editing, returned, approved, scheduled, published, updated, corrected and archived states.
- Section 7: Administrator, News Editor, Sub Editor and Reporter roles enforced in server actions.
- Section 8: editor-controlled breaking status and expiry.
- Section 20: hashed passwords, signed HTTP-only sessions, login lockout, two-factor authentication, server-side access control and activity logs.
- Section 33: auditable CMS workflow, user roles and production-build verification.

## Role rules

- Reporters create drafts, submit them, and edit only their own draft or returned stories.
- Sub Editors take submitted stories into editing, return them, and submit them for final review.
- News Editors approve, schedule, publish, correct, archive and manage breaking status.
- Administrators have editorial authority and manage users, roles, account status and audit records.

Every article save creates an immutable revision. Audit events identify the actor and action. Approval, publication and last-editor attribution are stored separately.

## Local setup

1. Copy `.env.example` to `.env` and set strong local values.
2. Start PostgreSQL with `docker compose up -d`.
3. Run `npx prisma migrate deploy`.
4. Run `npx prisma db seed` to create the initial administrator and reporter.
5. Run `npm run dev` and open `/login`.

Set `SESSION_SECRET` to at least 32 random characters before production deployment. Seed passwords are temporary and should be changed through **Newsroom → Security** immediately after first sign-in.

## Acceptance checks

- An unsigned visitor is redirected from `/admin/*` to `/login`.
- Five failed logins lock the account for 15 minutes.
- Passwords are bcrypt-hashed; legacy local passwords are upgraded at successful login.
- A password change invalidates existing signed sessions.
- Users can enable and verify TOTP two-factor authentication.
- A reporter cannot view other reporters' article lists, publish, approve or enable breaking status.
- A News Editor can approve, schedule and publish.
- Scheduled articles publish automatically after their scheduled time when the application handles a request.
- The article history identifies edits and workflow changes.
- The administrator can review the global activity log.
