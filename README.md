# Lunch Board

Internal lunch status board built with Vite, React, TypeScript, Cloudflare Pages Functions, Supabase/Postgres, Google Sheets fallback, and Resend.

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
npm run cloudflare:dev
npm run build
npm run preview
npm run migrate:supabase
npm run cloudflare:deploy
```

Use `npm run cloudflare:dev` for local full-stack testing because the frontend calls `/api/*` through Cloudflare Pages Functions.

## Supabase Migration

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Optionally run `supabase/realtime.sql` after the tables are created if you want Supabase Realtime publications.
4. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` to `.env`.
5. Run `npm run migrate:supabase` to copy current Google Sheets data into Supabase.
6. Add the same Supabase env vars to Cloudflare Pages production variables.

## Cloudflare Pages Deploy

1. Create or import this GitHub repo in Cloudflare Pages.
2. Use these build settings:

   ```text
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

3. Add these production variables/secrets in Cloudflare Pages:

   ```text
   SUPABASE_URL
   SUPABASE_SECRET_KEY
   JWT_SECRET
   RESEND_API_KEY
   FROM_EMAIL
   ```

4. Optional legacy fallback/import variables, only needed if you still use Google Sheets:

   ```text
   GOOGLE_SHEET_ID
   GOOGLE_SERVICE_ACCOUNT_EMAIL
   GOOGLE_PRIVATE_KEY
   ```

5. Deploy from GitHub or run:

   ```bash
   npm run cloudflare:deploy
   ```
