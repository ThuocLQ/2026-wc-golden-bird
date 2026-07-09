# Lunch Board

Internal lunch status board built with Vite, React, TypeScript, Netlify Functions, Supabase/Postgres, Google Sheets fallback, and Resend.

## Setup

1. Install dependencies:

   ```bash
   npm install --cache .npm-cache
   ```

2. For production, create a Supabase project and run `supabase/schema.sql` in the Supabase SQL Editor.

3. Copy `.env.example` to `.env` and fill the values. Do not prefix secrets with `VITE_`.

   Supabase is used automatically when the URL and server-side secret key are set:

   ```text
   SUPABASE_URL=
   SUPABASE_SECRET_KEY=
   ```

   Google Sheets is still supported as a fallback and as a migration source.

4. If you still need the Google Sheets fallback/import source, create a Google Sheet named `LunchBoardDB` with these tabs and headers:

   ```text
   users: id | email | displayName | pinHash | role | status | createdAt | updatedAt
   lunch_entries: id | lunchDate | userId | status | restaurantName | foodName | note | createdAt | updatedAt
   posts: id | lunchDate | authorId | content | status | createdAt | updatedAt
   comments: id | postId | authorId | content | status | createdAt | updatedAt
   reactions: id | userId | targetType | targetId | reactionType | status | createdAt | updatedAt
   email_logs: id | type | recipientEmail | subject | body | status | errorMessage | createdAt
   app_config: key | value | updatedAt
   ```

5. Generate an admin PIN hash:

   ```bash
   npm run hash-pin -- 123456
   ```

6. Seed the first admin row in `users`:

   ```text
   u_admin | admin@example.com | Admin | <bcrypt_hash> | ADMIN | ACTIVE | 2026-07-08T08:00:00+07:00 | 2026-07-08T08:00:00+07:00
   ```

## Commands

```bash
npm run dev
npm run netlify:dev
npm run build
npm run preview
npm run migrate:supabase
```

Use `npm run netlify:dev` for local full-stack testing because the frontend calls `/.netlify/functions/*`.

## Supabase Migration

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` to `.env`.
4. Run `npm run migrate:supabase` to copy current Google Sheets data into Supabase.
5. Add the same two Supabase env vars to Netlify production environment variables.
6. Deploy with `netlify deploy --build --prod`.
