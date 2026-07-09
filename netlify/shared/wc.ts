import { createId } from "./ids.js";
import { nowIso } from "./date.js";
import { appendRow, readTable, updateRow } from "./googleSheets.js";
import { valuesFor } from "./sheetTables.js";
import type { AppConfigRow, UserRow } from "./types.js";

type WcSlot = {
  slotNumber: number;
  userId: string;
  displayName: string;
  updatedAt: string;
};

type WcRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  status: "OPEN" | "CLOSED";
  joinedUsers: Array<{ id: string; displayName: string }>;
  createdAt: string;
  expiresAt: string;
};

type WcState = {
  slots: WcSlot[];
  requests: WcRequest[];
};

const configKey = "wc_state";

export async function getWcState() {
  const state = await readWcState();
  await saveWcState(state);
  return publicWcState(state);
}

export async function claimWcSlot(user: UserRow, slotNumber: number) {
  const state = await readWcState();
  const now = nowIso();
  state.slots = state.slots
    .filter((slot) => slot.userId !== user.id && slot.slotNumber !== slotNumber)
    .concat({ slotNumber, userId: user.id, displayName: user.displayName, updatedAt: now })
    .sort((a, b) => a.slotNumber - b.slotNumber);
  await saveWcState(state);
  return publicWcState(state);
}

export async function createWcRequest(user: UserRow) {
  const state = await readWcState();
  const now = nowIso();
  state.requests = state.requests.map((request) => (request.status === "OPEN" ? { ...request, status: "CLOSED" } : request));
  state.requests.push({
    id: createId("wc"),
    requesterId: user.id,
    requesterName: user.displayName,
    status: "OPEN",
    joinedUsers: [],
    createdAt: now,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  await saveWcState(state);
  return publicWcState(state);
}

export async function joinWcRequest(user: UserRow, requestId: string) {
  const state = await readWcState();
  state.requests = state.requests.map((request) => {
    if (request.id !== requestId || request.status !== "OPEN" || request.requesterId === user.id) return request;
    if (request.joinedUsers.some((item) => item.id === user.id)) return request;
    return { ...request, joinedUsers: [...request.joinedUsers, { id: user.id, displayName: user.displayName }] };
  });
  await saveWcState(state);
  return publicWcState(state);
}

export async function closeWcRequest(requestId: string) {
  const state = await readWcState();
  state.requests = state.requests.map((request) => (request.id === requestId ? { ...request, status: "CLOSED" } : request));
  await saveWcState(state);
  return publicWcState(state);
}

export async function wcVersion(): Promise<number> {
  const rows = await readTable<AppConfigRow>("app_config");
  const row = rows.find((item) => item.key === configKey);
  return row?.updatedAt ? Date.parse(row.updatedAt) || 0 : 0;
}

async function readWcState(): Promise<WcState> {
  const rows = await readTable<AppConfigRow>("app_config");
  const row = rows.find((item) => item.key === configKey);
  if (!row?.value) return { slots: [], requests: [] };
  try {
    const parsed = JSON.parse(row.value) as Partial<WcState>;
    return {
      slots: Array.isArray(parsed.slots) ? parsed.slots : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
    };
  } catch {
    return { slots: [], requests: [] };
  }
}

async function saveWcState(state: WcState) {
  const now = nowIso();
  const rows = await readTable<AppConfigRow>("app_config");
  const existing = rows.find((item) => item.key === configKey);
  const row: AppConfigRow = {
    key: configKey,
    value: JSON.stringify(pruneExpired(state)),
    updatedAt: now,
  };
  if (existing) {
    await updateRow("app_config", existing.rowNumber, valuesFor("app_config", row));
  } else {
    await appendRow("app_config", valuesFor("app_config", row));
  }
}

function publicWcState(state: WcState) {
  const next = pruneExpired(state);
  return {
    slots: next.slots,
    activeRequest: next.requests.find((request) => request.status === "OPEN") ?? null,
  };
}

function pruneExpired(state: WcState): WcState {
  const now = Date.now();
  return {
    slots: state.slots.filter((slot) => Date.parse(slot.updatedAt) > now - 24 * 60 * 60 * 1000),
    requests: state.requests.map((request) =>
      request.status === "OPEN" && Date.parse(request.expiresAt) <= now ? { ...request, status: "CLOSED" } : request,
    ),
  };
}
