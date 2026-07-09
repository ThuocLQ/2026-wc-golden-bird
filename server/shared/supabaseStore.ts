import { nowIso } from "./date.js";
import { appendRow, getSupabaseClient, hasSupabaseConfig, readTable, updateRow } from "./googleSheets.js";
import { ApiError } from "./response.js";
import { valuesFor } from "./sheetTables.js";
import type { AppConfigRow, CommentRow, LunchEntryRow, PostRow, ReactionRow, UserRow } from "./types.js";

export type ChangeResource = "today" | "feed" | "comments" | "members" | "notifications" | "wc";
export type VersionMap = Record<ChangeResource, number>;

const versionResources: ChangeResource[] = ["today", "feed", "comments", "members", "notifications", "wc"];

function versionKey(resource: ChangeResource): string {
  return `version:${resource}`;
}

function withRowNumber<T extends Record<string, unknown>>(rows: T[]): Array<T & { rowNumber: number }> {
  return rows.map((row, index) => ({ ...row, rowNumber: index + 2 }));
}

function assertSupabaseError(error: unknown, action: string): asserts error is null {
  if (error) {
    console.error(error);
    throw new ApiError("SHEET_ERROR", action);
  }
}

export function isSupabaseStoreEnabled(): boolean {
  return hasSupabaseConfig();
}

export async function findUserById(userId: string): Promise<(UserRow & { rowNumber: number }) | null> {
  if (!hasSupabaseConfig()) {
    const users = await readTable<UserRow>("users");
    return users.find((user) => user.id === userId) ?? null;
  }

  const { data, error } = await getSupabaseClient().from("users").select("*").eq("id", userId).maybeSingle();
  assertSupabaseError(error, "Could not read users");
  return data ? ({ ...(data as UserRow), rowNumber: 2 } as UserRow & { rowNumber: number }) : null;
}

export async function listActiveUsers(): Promise<Array<UserRow & { rowNumber: number }>> {
  if (!hasSupabaseConfig()) {
    const users = await readTable<UserRow>("users");
    return users.filter((user) => user.status === "ACTIVE");
  }

  const { data, error } = await getSupabaseClient().from("users").select("*").eq("status", "ACTIVE").order("displayName");
  assertSupabaseError(error, "Could not read users");
  return withRowNumber((data ?? []) as UserRow[]);
}

export async function listLunchEntriesByDate(lunchDate: string): Promise<Array<LunchEntryRow & { rowNumber: number }>> {
  if (!hasSupabaseConfig()) {
    const entries = await readTable<LunchEntryRow>("lunch_entries");
    return entries.filter((entry) => entry.lunchDate === lunchDate);
  }

  const { data, error } = await getSupabaseClient().from("lunch_entries").select("*").eq("lunchDate", lunchDate);
  assertSupabaseError(error, "Could not read lunch_entries");
  return withRowNumber((data ?? []) as LunchEntryRow[]);
}

export async function findTodayLunchEntry(lunchDate: string, userId: string): Promise<(LunchEntryRow & { rowNumber: number }) | null> {
  if (!hasSupabaseConfig()) {
    const entries = await readTable<LunchEntryRow>("lunch_entries");
    return entries.find((entry) => entry.lunchDate === lunchDate && entry.userId === userId) ?? null;
  }

  const { data, error } = await getSupabaseClient()
    .from("lunch_entries")
    .select("*")
    .eq("lunchDate", lunchDate)
    .eq("userId", userId)
    .maybeSingle();
  assertSupabaseError(error, "Could not read lunch_entries");
  return data ? ({ ...(data as LunchEntryRow), rowNumber: 2 } as LunchEntryRow & { rowNumber: number }) : null;
}

export async function upsertLunchEntry(row: LunchEntryRow): Promise<void> {
  if (!hasSupabaseConfig()) {
    const existing = await findTodayLunchEntry(row.lunchDate, row.userId);
    if (existing) await updateRow("lunch_entries", existing.rowNumber, valuesFor("lunch_entries", row));
    else await appendRow("lunch_entries", valuesFor("lunch_entries", row));
    return;
  }

  const { error } = await getSupabaseClient().from("lunch_entries").upsert(row, { onConflict: "lunchDate,userId" });
  assertSupabaseError(error, "Could not update lunch_entries");
}

export async function listPostsByDate(lunchDate: string): Promise<Array<PostRow & { rowNumber: number }>> {
  if (!hasSupabaseConfig()) {
    const posts = await readTable<PostRow>("posts");
    return posts.filter((post) => post.lunchDate === lunchDate && post.status === "ACTIVE").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data, error } = await getSupabaseClient()
    .from("posts")
    .select("*")
    .eq("lunchDate", lunchDate)
    .eq("status", "ACTIVE")
    .order("createdAt", { ascending: false });
  assertSupabaseError(error, "Could not read posts");
  return withRowNumber((data ?? []) as PostRow[]);
}

export async function findActivePost(postId: string): Promise<(PostRow & { rowNumber: number }) | null> {
  if (!hasSupabaseConfig()) {
    const posts = await readTable<PostRow>("posts");
    return posts.find((post) => post.id === postId && post.status === "ACTIVE") ?? null;
  }

  const { data, error } = await getSupabaseClient().from("posts").select("*").eq("id", postId).eq("status", "ACTIVE").maybeSingle();
  assertSupabaseError(error, "Could not read posts");
  return data ? ({ ...(data as PostRow), rowNumber: 2 } as PostRow & { rowNumber: number }) : null;
}

export async function listCommentsByPostIds(postIds: string[]): Promise<Array<CommentRow & { rowNumber: number }>> {
  if (postIds.length === 0) return [];
  if (!hasSupabaseConfig()) {
    const comments = await readTable<CommentRow>("comments");
    return comments
      .filter((comment) => postIds.includes(comment.postId) && comment.status === "ACTIVE")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const { data, error } = await getSupabaseClient()
    .from("comments")
    .select("*")
    .in("postId", postIds)
    .eq("status", "ACTIVE")
    .order("createdAt", { ascending: true });
  assertSupabaseError(error, "Could not read comments");
  return withRowNumber((data ?? []) as CommentRow[]);
}

export async function findActiveComment(commentId: string): Promise<(CommentRow & { rowNumber: number }) | null> {
  if (!hasSupabaseConfig()) {
    const comments = await readTable<CommentRow>("comments");
    return comments.find((comment) => comment.id === commentId && comment.status === "ACTIVE") ?? null;
  }

  const { data, error } = await getSupabaseClient().from("comments").select("*").eq("id", commentId).eq("status", "ACTIVE").maybeSingle();
  assertSupabaseError(error, "Could not read comments");
  return data ? ({ ...(data as CommentRow), rowNumber: 2 } as CommentRow & { rowNumber: number }) : null;
}

export async function listReactionsForTargets(targets: Array<{ targetType: string; targetId: string }>): Promise<Array<ReactionRow & { rowNumber: number }>> {
  if (targets.length === 0) return [];
  if (!hasSupabaseConfig()) {
    const reactions = await readTable<ReactionRow>("reactions");
    return reactions.filter((reaction) => targets.some((target) => target.targetType === reaction.targetType && target.targetId === reaction.targetId));
  }

  const clauses = targets.map((target) => `and(targetType.eq.${target.targetType},targetId.eq.${target.targetId})`);
  const { data, error } = await getSupabaseClient().from("reactions").select("*").or(clauses.join(","));
  assertSupabaseError(error, "Could not read reactions");
  return withRowNumber((data ?? []) as ReactionRow[]);
}

export async function findReaction(userId: string, targetType: string, targetId: string): Promise<(ReactionRow & { rowNumber: number }) | null> {
  if (!hasSupabaseConfig()) {
    const reactions = await readTable<ReactionRow>("reactions");
    return reactions.find((item) => item.userId === userId && item.targetType === targetType && item.targetId === targetId) ?? null;
  }

  const { data, error } = await getSupabaseClient()
    .from("reactions")
    .select("*")
    .eq("userId", userId)
    .eq("targetType", targetType)
    .eq("targetId", targetId)
    .maybeSingle();
  assertSupabaseError(error, "Could not read reactions");
  return data ? ({ ...(data as ReactionRow), rowNumber: 2 } as ReactionRow & { rowNumber: number }) : null;
}

export async function saveReaction(row: ReactionRow): Promise<void> {
  if (!hasSupabaseConfig()) {
    const existing = await findReaction(row.userId, row.targetType, row.targetId);
    if (existing) await updateRow("reactions", existing.rowNumber, valuesFor("reactions", row));
    else await appendRow("reactions", valuesFor("reactions", row));
    return;
  }

  const { error } = await getSupabaseClient().from("reactions").upsert(row, { onConflict: "userId,targetType,targetId" });
  assertSupabaseError(error, "Could not update reactions");
}

export async function updateById<T extends { id: string }>(tableName: "posts" | "comments", row: T): Promise<void> {
  if (!hasSupabaseConfig()) {
    const tableRows = await readTable<T>(tableName);
    const existing = tableRows.find((item) => item.id === row.id);
    if (!existing) throw new ApiError("NOT_FOUND", "Row not found");
    await updateRow(tableName, existing.rowNumber, valuesFor(tableName, row));
    return;
  }

  const { rowNumber: _rowNumber, ...payload } = row as T & { rowNumber?: number };
  const { error } = await getSupabaseClient().from(tableName).update(payload as Record<string, unknown>).eq("id", row.id);
  assertSupabaseError(error, `Could not update ${tableName}`);
}

export async function getResourceVersions(): Promise<VersionMap> {
  const versions: VersionMap = { today: 0, feed: 0, comments: 0, members: 0, notifications: 0, wc: 0 };
  if (!hasSupabaseConfig()) return versions;

  const keys = versionResources.map(versionKey);
  const { data, error } = await getSupabaseClient().from("app_config").select("key,value,updatedAt").in("key", keys);
  assertSupabaseError(error, "Could not read app_config");

  for (const row of (data ?? []) as AppConfigRow[]) {
    const resource = row.key.replace("version:", "") as ChangeResource;
    if (!versionResources.includes(resource)) continue;
    const value = Number(row.value);
    versions[resource] = Number.isFinite(value) && value > 0 ? value : Date.parse(row.updatedAt) || 0;
  }

  return versions;
}

export async function touchVersions(resources: ChangeResource[]): Promise<void> {
  const unique = [...new Set(resources)];
  if (unique.length === 0 || !hasSupabaseConfig()) return;

  const at = Date.now();
  const updatedAt = nowIso();
  const rows: AppConfigRow[] = unique.map((resource) => ({
    key: versionKey(resource),
    value: String(at),
    updatedAt,
  }));

  const { error } = await getSupabaseClient().from("app_config").upsert(rows, { onConflict: "key" });
  assertSupabaseError(error, "Could not update app_config");
}
