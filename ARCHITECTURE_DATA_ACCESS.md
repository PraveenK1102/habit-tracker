# Data Access Architecture (Client + Server) — Habit Tracker

## Goal
Keep the app secure, maintainable, and easy to evolve by following a simple rule:

> **Client UI should not talk to database tables directly.**  
> Client talks to **your API routes**. API routes talk to **Supabase (SQL)**.

This prevents:
- leaking schema details into UI
- accidental privilege escalation
- duplicated “business rules” across components
- fragile changes when tables/columns evolve

---

## The pattern we use

### 1) Client (React components)
- Collect user input (forms, buttons)
- Call your API (`fetch('/api/...')`)
- Render results

**Client should be allowed to use Supabase only for auth session state** (e.g., `supabase.auth.getSession()`), not table reads/writes.

### 2) Server (Next.js Route Handlers)
Files like:
- `app/api/tasks/route.ts`
- `app/api/profile/route.ts`

Responsibilities:
- authenticate the user
- validate input
- run SQL operations via Supabase
- enforce ownership checks (`.eq('user_id', userId)`)
- return a consistent JSON response

---

## Why we fixed `lib/supabaseServer.ts`

Route handlers should use the route-handler client:
- `createRouteHandlerClient({ cookies })`

This ensures auth cookies work correctly for API routes (read/write).

---

## Concrete examples from this repo

### Task edit screen
**Before (problem):**
- UI directly called `supabase.from('tasks')...`

**Now (better):**
- UI calls `GET /api/tasks?id=<taskId>`
- Server does auth + DB read + ownership filter

### Task delete
**Before (problem):**
- UI directly deleted from `tasks`

**Now (better):**
- UI calls `DELETE /api/tasks` with `{ id }`
- Server validates + deletes only if `user_id` matches

---

## Rules to follow going forward

- **Rule 1**: Any create/update/delete must be done in `app/api/**` (server).
- **Rule 2**: Any “read that affects privacy” should be in server routes too (tasks, tracking, profile).
- **Rule 3**: Always scope queries by user ownership (`user_id`) or rely on RLS *plus* explicit checks for safety.
- **Rule 4**: Avoid “schema workarounds” in UI (example: storing JSON in tags). Prefer schema fixes or server-side normalization.
- **Rule 5**: Keep response shapes consistent (ex: always `{ data, error }`).

---

## Database relationships and delete behavior

Primary identity flow:
- `auth.users.id` is the canonical user id.
- `profiles.user_id` references `auth.users.id` and is **unique**.
- `profiles.id` is a separate profile row id.

Tables that reference `profiles.user_id`:
- `tasks.user_id`
- `messages.sender_id`
- `conversation_participants.user_id`
- `conversations.created_by`
- `connection_requests.sender_id`, `connection_requests.receiver_id`

Expected delete cascade:
- Deleting a user from `auth.users` should delete the related `profiles` row.
- That deletion should cascade to all `profiles.user_id` references listed above.
- Task-owned tables (`task_tracking`) already cascade via `tasks.id`.

This cascade chain is enforced in `supabase/migrations/20260128000001_enable_user_cascades.sql` to prevent account deletion from failing with FK errors.

---

## Next step (Option A chatbot)
We’ll follow the same discipline:

- Client: sends message to `/api/llmchatbot`
- Server:
  - LLM “planner” (local, open-source)
  - SQL retrieval (FTS + trigram)
  - confirmation policy
  - executor calls the same task/tracking APIs (or shared server functions)


