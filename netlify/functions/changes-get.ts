import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { readTable } from "../shared/googleSheets.js";
import { handleApi, ok } from "../shared/response.js";
import type { AppConfigRow, CommentRow, EmailLogRow, LunchEntryRow, PostRow, ReactionRow, UserRow } from "../shared/types.js";

type ChangeResource = "today" | "feed" | "comments" | "members" | "notifications";

type VersionMap = Record<ChangeResource, number>;

export const handler: Handler = async (event) =>
  handleApi(async () => {
    await requireAuth(event);
    const since = Number(event.queryStringParameters?.since ?? 0);
    const versions = await getVersions();

    const changed = (Object.keys(versions) as ChangeResource[]).filter((key) => versions[key] > since);
    return ok({
      version: Math.max(...Object.values(versions), Date.now()),
      versions,
      changed,
    });
  });

async function getVersions(): Promise<VersionMap> {
  const [users, lunchEntries, posts, comments, reactions, emailLogs, appConfig] = await Promise.all([
    readTable<UserRow>("users"),
    readTable<LunchEntryRow>("lunch_entries"),
    readTable<PostRow>("posts"),
    readTable<CommentRow>("comments"),
    readTable<ReactionRow>("reactions"),
    readTable<EmailLogRow>("email_logs"),
    readTable<AppConfigRow>("app_config"),
  ]);

  return {
    today: latestMs([...users, ...lunchEntries, ...appConfig]),
    feed: latestMs([...users, ...posts, ...comments, ...reactions]),
    comments: latestMs([...users, ...comments, ...reactions]),
    members: latestMs(users),
    notifications: latestMs(emailLogs),
  };
}

function latestMs(rows: Array<{ updatedAt?: string; createdAt?: string }>): number {
  return rows.reduce((max, row) => {
    const value = row.updatedAt || row.createdAt || "";
    const time = value ? Date.parse(value) : 0;
    return Number.isFinite(time) ? Math.max(max, time) : max;
  }, 0);
}
