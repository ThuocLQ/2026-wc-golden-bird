create table if not exists users (
  id text primary key,
  email text not null unique,
  "displayName" text not null,
  "pinHash" text not null,
  role text not null check (role in ('ADMIN', 'MEMBER')),
  status text not null check (status in ('ACTIVE', 'DISABLED')),
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists lunch_entries (
  id text primary key,
  "lunchDate" date not null,
  "userId" text not null references users(id) on delete cascade,
  status text not null check (status in ('BRING_LUNCH', 'EAT_OUT', 'NO_LUNCH', 'UNDECIDED')),
  "restaurantName" text not null default '',
  "foodName" text not null default '',
  note text not null default '',
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  unique ("lunchDate", "userId")
);

create table if not exists posts (
  id text primary key,
  "lunchDate" date not null,
  "authorId" text not null references users(id) on delete cascade,
  content text not null,
  status text not null check (status in ('ACTIVE', 'DELETED')),
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists comments (
  id text primary key,
  "postId" text not null references posts(id) on delete cascade,
  "authorId" text not null references users(id) on delete cascade,
  content text not null,
  status text not null check (status in ('ACTIVE', 'DELETED')),
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists reactions (
  id text primary key,
  "userId" text not null references users(id) on delete cascade,
  "targetType" text not null check ("targetType" in ('POST', 'COMMENT')),
  "targetId" text not null,
  "reactionType" text not null default '' check ("reactionType" in ('LIKE', 'LOVE', 'ANGRY', '')),
  status text not null check (status in ('ACTIVE', 'DELETED')),
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  unique ("userId", "targetType", "targetId")
);

create table if not exists email_logs (
  id text primary key,
  type text not null check (type in ('REMINDER', 'DAILY_SUMMARY', 'MANUAL')),
  "recipientEmail" text not null,
  subject text not null,
  body text not null,
  status text not null check (status in ('PENDING', 'SENT', 'FAILED')),
  "errorMessage" text not null default '',
  "createdAt" timestamptz not null
);

create table if not exists app_config (
  key text primary key,
  value text not null,
  "updatedAt" timestamptz not null
);

create index if not exists lunch_entries_date_idx on lunch_entries ("lunchDate");
create index if not exists posts_date_status_idx on posts ("lunchDate", status, "createdAt" desc);
create index if not exists comments_post_status_idx on comments ("postId", status, "createdAt");
create index if not exists reactions_target_idx on reactions ("targetType", "targetId", status);
create index if not exists email_logs_created_idx on email_logs ("createdAt" desc);

do $$
begin
  alter publication supabase_realtime add table users;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table lunch_entries;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table posts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table reactions;
exception when duplicate_object then null;
end $$;
