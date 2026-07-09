import { getTodayLocalDate } from "./date.js";
import { listActiveUsers, listLunchEntriesByDate } from "./supabaseStore.js";
import type { LunchEntryRow, LunchStatus, UserRow } from "./types.js";

const lunchStatuses: LunchStatus[] = ["BRING_LUNCH", "EAT_OUT", "NO_LUNCH", "UNDECIDED"];

export function activeUsers(users: UserRow[]): UserRow[] {
  return users.filter((user) => user.status === "ACTIVE");
}

export async function getTodayDashboard(currentUserId: string) {
  const date = getTodayLocalDate();
  const [users, entries] = await Promise.all([listActiveUsers(), listLunchEntriesByDate(date)]);

  const entryByUser = new Map(entries.map((entry) => [entry.userId, entry]));

  const groups = {
    bringLunch: [] as Array<Record<string, string>>,
    eatOut: [] as Array<Record<string, string>>,
    noLunch: [] as Array<Record<string, string>>,
    undecided: [] as Array<Record<string, string>>,
    notUpdated: [] as Array<Record<string, string>>,
  };

  for (const user of users) {
    const entry = entryByUser.get(user.id);
    const item = {
      userId: user.id,
      displayName: user.displayName,
      status: entry?.status ?? "",
      restaurantName: entry?.restaurantName ?? "",
      foodName: entry?.foodName ?? "",
      note: entry?.note ?? "",
    };

    if (!entry) groups.notUpdated.push(item);
    else if (entry.status === "BRING_LUNCH") groups.bringLunch.push(item);
    else if (entry.status === "EAT_OUT") groups.eatOut.push(item);
    else if (entry.status === "NO_LUNCH") groups.noLunch.push(item);
    else groups.undecided.push(item);
  }

  const counts = countEntries(entries);
  const updatedCount = users.filter((user) => entryByUser.has(user.id)).length;

  return {
    date,
    me: entryByUser.get(currentUserId) ?? {
      status: "UNDECIDED",
      restaurantName: "",
      foodName: "",
      note: "",
    },
    summary: {
      totalMembers: users.length,
      updatedCount,
      notUpdatedCount: users.length - updatedCount,
      bringLunchCount: counts.BRING_LUNCH,
      eatOutCount: counts.EAT_OUT,
      noLunchCount: counts.NO_LUNCH,
      undecidedCount: counts.UNDECIDED + groups.notUpdated.length,
    },
    groups,
    topRestaurants: topValues(entries.map((entry) => entry.restaurantName)),
    topFoods: topValues(entries.map((entry) => entry.foodName)),
  };
}

function countEntries(entries: LunchEntryRow[]): Record<LunchStatus, number> {
  return lunchStatuses.reduce<Record<LunchStatus, number>>((acc, status) => {
    acc[status] = entries.filter((entry) => entry.status === status).length;
    return acc;
  }, { BRING_LUNCH: 0, EAT_OUT: 0, NO_LUNCH: 0, UNDECIDED: 0 });
}

function topValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}
