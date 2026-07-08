# Lunch Board

Internal lunch status board built with Vite, React, TypeScript, Netlify Functions, Google Sheets, and Resend.

## Setup

1. Install dependencies:

   ```bash
   npm install --cache .npm-cache
   ```

2. Create a Google Sheet named `LunchBoardDB` with these tabs and headers:

   ```text
   users: id | email | displayName | pinHash | role | status | createdAt | updatedAt
   lunch_entries: id | lunchDate | userId | status | restaurantName | foodName | note | createdAt | updatedAt
   posts: id | lunchDate | authorId | content | status | createdAt | updatedAt
   comments: id | postId | authorId | content | status | createdAt | updatedAt
   reactions: id | userId | targetType | targetId | reactionType | status | createdAt | updatedAt
   email_logs: id | type | recipientEmail | subject | body | status | errorMessage | createdAt
   app_config: key | value | updatedAt
   ```

3. Copy `.env.example` to `.env` and fill the values. Do not prefix secrets with `VITE_`.

4. Generate an admin PIN hash:

   ```bash
   npm run hash-pin -- 123456
   ```

5. Seed the first admin row in `users`:

   ```text
   u_admin | admin@example.com | Admin | <bcrypt_hash> | ADMIN | ACTIVE | 2026-07-08T08:00:00+07:00 | 2026-07-08T08:00:00+07:00
   ```

## Commands

```bash
npm run dev
npm run netlify:dev
npm run build
npm run preview
```

Use `npm run netlify:dev` for local full-stack testing because the frontend calls `/.netlify/functions/*`.
