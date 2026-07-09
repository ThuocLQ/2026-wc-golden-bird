import { requireAuth } from "../shared/auth.js";
import { hasSupabaseConfig, readTable } from "../shared/googleSheets.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import { getResourceVersions, type ChangeResource, type VersionMap } from "../shared/supabaseStore.js";
import type { AppConfigRow, CommentRow, EmailLogRow, LunchEntryRow, PostRow, ReactionRow, UserRow } from "../shared/types.js";
import { wcVersion } from "../shared/wc.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    await requireAuth(event);
    const since = Number(event.queryStringParameters?.since ?? 0);
    const versions = hasSupabaseConfig() ? await getResourceVersions() : await getLegacyVersions();

    const changed = (Object.keys(versions) as ChangeResource[]).filter((key) => versions[key] > since);
    return ok({
      version: Math.max(...Object.values(versions), since),
      versions,
      changed,
    });
  });

async function getLegacyVersions(): Promise<VersionMap> {
  const [users, lunchEntries, posts, comments, reactions, emailLogs, appConfig, wc] = await Promise.all([
    readTable<UserRow>("users"),
    readTable<LunchEntryRow>("lunch_entries"),
    readTable<PostRow>("posts"),
    readTable<CommentRow>("comments"),
    readTable<ReactionRow>("reactions"),
    readTable<EmailLogRow>("email_logs"),
    readTable<AppConfigRow>("app_config"),
    wcVersion(),
  ]);

  return {
    today: latestMs([...users, ...lunchEntries, ...appConfig]),
    feed: latestMs([...users, ...posts, ...comments, ...reactions]),
    comments: latestMs([...users, ...comments, ...reactions]),
    members: latestMs(users),
    notifications: latestMs(emailLogs),
    wc,
  };
}

function latestMs(rows: Array<{ updatedAt?: string; createdAt?: string }>): number {
  return rows.reduce((max, row) => {
    const value = row.updatedAt || row.createdAt || "";
    const time = value ? Date.parse(value) : 0;
    return Number.isFinite(time) ? Math.max(max, time) : max;
  }, 0);
}
