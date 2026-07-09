import type { Member } from "../features/admin/types";
import type { CurrentUser } from "../features/auth/types";
import type { Comment, Post, ReactionSummary, ReactionType, TargetType } from "../features/feed/types";
import type { LunchPerson, LunchStatus, TodayDashboardData } from "../features/lunch/types";
import type { WcRequest, WcSlot, WcState } from "../features/wc/types";
import { demoAdmin } from "./demoAccounts";

type LunchEntry = {
  userId: string;
  status: LunchStatus;
  restaurantName: string;
  foodName: string;
  note: string;
};

type MockEmailLog = {
  id: string;
  type: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: "PENDING" | "SENT" | "FAILED";
  errorMessage: string;
  createdAt: string;
};

type MockState = {
  members: Member[];
  lunchEntries: LunchEntry[];
  posts: Post[];
  comments: Comment[];
  emailLogs: MockEmailLog[];
  reactions: Record<string, ReactionType>;
  wcSlots: WcSlot[];
  wcRequests: WcRequest[];
};

const dbKey = "golden-bird-mock-db-v1";
const userKey = "lunch-board-user";

export async function mockApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  await delay(120);
  const { endpoint, searchParams } = parsePath(path);
  const body = readBody(init.body);
  const state = loadState();

  switch (endpoint) {
    case "auth-login":
      return login(body, state) as T;
    case "auth-me":
      return currentUser(state) as T;
    case "today-get":
      return buildToday(state) as T;
    case "lunch-entry-upsert":
      return upsertLunchEntry(state, body) as T;
    case "posts-list":
      return listPosts(state) as T;
    case "posts-create":
      return createPost(state, body) as T;
    case "posts-delete":
      return deletePost(state, body) as T;
    case "comments-list":
      return state.comments
        .filter((comment) => comment.postId === searchParams.get("postId"))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((comment) => hydrateComment(state, comment)) as T;
    case "comments-create":
      return createComment(state, body) as T;
    case "comments-delete":
      return deleteComment(state, body) as T;
    case "reactions-toggle":
      return toggleReaction(state, body) as T;
    case "admin-members-list":
      return state.members as T;
    case "admin-member-create":
      return createMember(state, body) as T;
    case "admin-member-disable":
      return disableMember(state, body) as T;
    case "admin-set-pin":
      return undefined as T;
    case "email-send-reminder":
      return sendReminder(state) as T;
    case "email-logs-list":
      return state.emailLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50) as T;
    case "wc-state-get":
      return buildWcState(state) as T;
    case "wc-slot-claim":
      return claimWcSlot(state, body) as T;
    case "wc-request-create":
      return createWcRequest(state) as T;
    case "wc-request-join":
      return joinWcRequest(state, body) as T;
    case "wc-request-close":
      return closeWcRequest(state, body) as T;
    default:
      throw new Error(`Mock API chưa hỗ trợ endpoint: ${endpoint}`);
  }
}

function login(body: Record<string, unknown>, state: MockState) {
  const email = String(body.email || demoAdmin.email).toLowerCase();
  const pin = String(body.pin || "");
  if (email === demoAdmin.email && pin && pin !== demoAdmin.pin) {
    throw new Error("Demo admin PIN là 123456");
  }
  const existing = state.members.find((member) => member.email.toLowerCase() === email);
  const user = existing
    ? toCurrentUser(existing)
    : {
        id: "u_demo",
        email,
        displayName: email.includes("@") ? email.split("@")[0] : "Demo User",
        role: email.includes("admin") ? "ADMIN" : "MEMBER",
      } satisfies CurrentUser;
  localStorage.setItem(userKey, JSON.stringify(user));
  return { token: "mock-token", user };
}

function upsertLunchEntry(state: MockState, body: Record<string, unknown>) {
  const user = currentUser(state);
  const entry: LunchEntry = {
    userId: user.id,
    status: String(body.status || "UNDECIDED") as LunchStatus,
    restaurantName: String(body.restaurantName || ""),
    foodName: String(body.foodName || ""),
    note: String(body.note || ""),
  };
  state.lunchEntries = state.lunchEntries.filter((item) => item.userId !== user.id).concat(entry);
  saveState(state);
}

function createPost(state: MockState, body: Record<string, unknown>) {
  const user = currentUser(state);
  const post: Post = {
    id: id("post"),
    lunchDate: today(),
    author: { id: user.id, displayName: user.displayName },
    content: String(body.content || ""),
    reactionSummary: emptyReactions(),
    myReaction: null,
    commentCount: 0,
    comments: [],
    createdAt: now(),
    canDelete: true,
  };
  state.posts = [post, ...state.posts];
  saveState(state);
}

function deletePost(state: MockState, body: Record<string, unknown>) {
  const postId = String(body.postId || "");
  state.posts = state.posts.filter((post) => post.id !== postId);
  state.comments = state.comments.filter((comment) => comment.postId !== postId);
  saveState(state);
}

function listPosts(state: MockState): Post[] {
  return state.posts
    .filter((post) => post.lunchDate === today())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((post) => hydratePost(state, post));
}

function hydratePost(state: MockState, post: Post): Post {
  const comments = state.comments
    .filter((comment) => comment.postId === post.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((comment) => hydrateComment(state, comment));

  return {
    ...post,
    reactionSummary: reactionSummary(state, "POST", post.id),
    myReaction: myReaction(state, "POST", post.id),
    commentCount: comments.length,
    comments,
  };
}

function hydrateComment(state: MockState, comment: Comment): Comment {
  return {
    ...comment,
    reactionSummary: reactionSummary(state, "COMMENT", comment.id),
    myReaction: myReaction(state, "COMMENT", comment.id),
  };
}

function createComment(state: MockState, body: Record<string, unknown>) {
  const user = currentUser(state);
  const postId = String(body.postId || "");
  const comment: Comment = {
    id: id("comment"),
    postId,
    author: { id: user.id, displayName: user.displayName },
    content: String(body.content || ""),
    reactionSummary: emptyReactions(),
    myReaction: null,
    createdAt: now(),
    canDelete: true,
  };
  state.comments = [...state.comments, comment];
  state.posts = state.posts.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post));
  saveState(state);
}

function deleteComment(state: MockState, body: Record<string, unknown>) {
  const commentId = String(body.commentId || "");
  const comment = state.comments.find((item) => item.id === commentId);
  state.comments = state.comments.filter((item) => item.id !== commentId);
  if (comment) {
    state.posts = state.posts.map((post) => (post.id === comment.postId ? { ...post, commentCount: Math.max(0, post.commentCount - 1) } : post));
  }
  saveState(state);
}

function toggleReaction(state: MockState, body: Record<string, unknown>) {
  const user = currentUser(state);
  const targetType = String(body.targetType || "POST") as TargetType;
  const targetId = String(body.targetId || "");
  const reactionType = String(body.reactionType || "LIKE") as ReactionType;
  const reactionKey = `${targetType}:${targetId}:${user.id}`;
  const current = state.reactions[reactionKey];
  if (current === reactionType) delete state.reactions[reactionKey];
  else state.reactions[reactionKey] = reactionType;

  state.posts = state.posts.map((post) =>
    targetType === "POST" && post.id === targetId ? { ...post, reactionSummary: reactionSummary(state, "POST", post.id), myReaction: state.reactions[reactionKey] ?? null } : post,
  );
  state.comments = state.comments.map((comment) =>
    targetType === "COMMENT" && comment.id === targetId
      ? { ...comment, reactionSummary: reactionSummary(state, "COMMENT", comment.id), myReaction: state.reactions[reactionKey] ?? null }
      : comment,
  );
  saveState(state);
}

function createMember(state: MockState, body: Record<string, unknown>) {
  const member: Member = {
    id: id("user"),
    email: String(body.email || ""),
    displayName: String(body.displayName || ""),
    role: String(body.role || "MEMBER") as "ADMIN" | "MEMBER",
    status: "ACTIVE",
    createdAt: now(),
    updatedAt: now(),
  };
  state.members = [member, ...state.members];
  saveState(state);
}

function disableMember(state: MockState, body: Record<string, unknown>) {
  const userId = String(body.userId || "");
  state.members = state.members.map((member) => (member.id === userId ? { ...member, status: "DISABLED", updatedAt: now() } : member));
  saveState(state);
}

function sendReminder(state: MockState) {
  const activeMembers = state.members.filter((member) => member.status === "ACTIVE");
  const logs = activeMembers.map((member) => ({
    id: id("mail"),
    type: "REMINDER",
    recipientEmail: member.email,
    subject: "Golden Bird Lunch Cup reminder",
    body: "Nhớ cập nhật bữa trưa hôm nay nhé.",
    status: "SENT" as const,
    errorMessage: "",
    createdAt: now(),
  }));
  state.emailLogs = [...logs, ...state.emailLogs];
  saveState(state);
  return { sentCount: logs.length, failedCount: 0, results: logs.map((log) => ({ email: log.recipientEmail, status: log.status })) };
}

function buildWcState(state: MockState): WcState {
  state.wcRequests = expireOldWcRequests(state.wcRequests);
  saveState(state);
  return {
    slots: state.wcSlots.sort((a, b) => a.slotNumber - b.slotNumber),
    activeRequest: activeWcRequest(state),
  };
}

function claimWcSlot(state: MockState, body: Record<string, unknown>) {
  const user = currentUser(state);
  const slotNumber = Number(body.slotNumber);
  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 5) throw new Error("Ô WC không hợp lệ");
  state.wcSlots = state.wcSlots
    .filter((slot) => slot.userId !== user.id && slot.slotNumber !== slotNumber)
    .concat({ slotNumber, userId: user.id, displayName: user.displayName, updatedAt: now() });
  saveState(state);
}

function createWcRequest(state: MockState) {
  const user = currentUser(state);
  state.wcRequests = state.wcRequests.map((request) => (request.status === "OPEN" ? { ...request, status: "CLOSED" } : request));
  state.wcRequests.push({
    id: id("wc"),
    requesterId: user.id,
    requesterName: user.displayName,
    status: "OPEN",
    joinedUsers: [],
    createdAt: now(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  saveState(state);
}

function joinWcRequest(state: MockState, body: Record<string, unknown>) {
  const user = currentUser(state);
  const requestId = String(body.requestId || "");
  state.wcRequests = state.wcRequests.map((request) => {
    if (request.id !== requestId || request.status !== "OPEN" || request.requesterId === user.id) return request;
    if (request.joinedUsers.some((item) => item.id === user.id)) return request;
    return { ...request, joinedUsers: [...request.joinedUsers, { id: user.id, displayName: user.displayName }] };
  });
  saveState(state);
}

function closeWcRequest(state: MockState, body: Record<string, unknown>) {
  const requestId = String(body.requestId || "");
  state.wcRequests = state.wcRequests.map((request) => (request.id === requestId ? { ...request, status: "CLOSED" } : request));
  saveState(state);
}

function buildToday(state: MockState): TodayDashboardData {
  const user = currentUser(state);
  const activeMembers = state.members.filter((member) => member.status === "ACTIVE");
  if (!activeMembers.some((member) => member.id === user.id)) {
    activeMembers.push({ id: user.id, email: user.email, displayName: user.displayName, role: user.role, status: "ACTIVE", createdAt: now(), updatedAt: now() });
  }

  const entryByUser = new Map(state.lunchEntries.map((entry) => [entry.userId, entry]));
  const people = activeMembers.map((member) => toLunchPerson(member, entryByUser.get(member.id)));
  const me = entryByUser.get(user.id) ?? { userId: user.id, status: "UNDECIDED", restaurantName: "", foodName: "", note: "" };

  const groups = {
    bringLunch: people.filter((person) => person.status === "BRING_LUNCH"),
    eatOut: people.filter((person) => person.status === "EAT_OUT"),
    noLunch: people.filter((person) => person.status === "NO_LUNCH"),
    undecided: people.filter((person) => person.status === "UNDECIDED"),
    notUpdated: people.filter((person) => !person.status),
  };

  return {
    date: today(),
    me: { status: me.status, restaurantName: me.restaurantName, foodName: me.foodName, note: me.note },
    summary: {
      totalMembers: activeMembers.length,
      updatedCount: people.filter((person) => person.status).length,
      notUpdatedCount: groups.notUpdated.length,
      bringLunchCount: groups.bringLunch.length,
      eatOutCount: groups.eatOut.length,
      noLunchCount: groups.noLunch.length,
      undecidedCount: groups.undecided.length,
    },
    groups,
    topRestaurants: topCounts(groups.eatOut.map((person) => person.restaurantName)),
    topFoods: topCounts(groups.eatOut.map((person) => person.foodName)),
  };
}

function toLunchPerson(member: Member, entry?: LunchEntry): LunchPerson {
  return {
    userId: member.id,
    displayName: member.displayName,
    status: entry?.status ?? "",
    restaurantName: entry?.restaurantName ?? "",
    foodName: entry?.foodName ?? "",
    note: entry?.note ?? "",
  };
}

function currentUser(state: MockState): CurrentUser {
  const raw = localStorage.getItem(userKey);
  if (raw) return JSON.parse(raw) as CurrentUser;
  return toCurrentUser(state.members[0]);
}

function toCurrentUser(member: Member): CurrentUser {
  return { id: member.id, email: member.email, displayName: member.displayName, role: member.role };
}

function reactionSummary(state: MockState, targetType: TargetType, targetId: string): ReactionSummary {
  const summary = emptyReactions();
  Object.entries(state.reactions).forEach(([key, reaction]) => {
    if (key.startsWith(`${targetType}:${targetId}:`)) summary[reaction] += 1;
  });
  return summary;
}

function myReaction(state: MockState, targetType: TargetType, targetId: string): ReactionType | null {
  const user = currentUser(state);
  return state.reactions[`${targetType}:${targetId}:${user.id}`] ?? null;
}

function emptyReactions(): ReactionSummary {
  return { LIKE: 0, LOVE: 0, ANGRY: 0 };
}

function topCounts(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function loadState(): MockState {
  const raw = localStorage.getItem(dbKey);
  if (raw) return normalizeState(JSON.parse(raw) as Partial<MockState>);
  const seeded = seedState();
  saveState(seeded);
  return seeded;
}

function normalizeState(state: Partial<MockState>): MockState {
  const normalized = {
    members: state.members ?? [],
    lunchEntries: state.lunchEntries ?? [],
    posts: (state.posts ?? []).map((post) => ({ ...post, comments: post.comments ?? [], commentCount: post.commentCount ?? 0 })),
    comments: state.comments ?? [],
    emailLogs: state.emailLogs ?? [],
    reactions: state.reactions ?? {},
    wcSlots: state.wcSlots ?? [],
    wcRequests: state.wcRequests ?? [],
  };
  if (!normalized.members.some((member) => member.email === demoAdmin.email)) {
    const createdAt = now();
    normalized.members.unshift({ id: demoAdmin.id, email: demoAdmin.email, displayName: demoAdmin.displayName, role: demoAdmin.role, status: "ACTIVE", createdAt, updatedAt: createdAt });
  }
  return normalized;
}

function saveState(state: MockState) {
  localStorage.setItem(dbKey, JSON.stringify(state));
}

function seedState(): MockState {
  const date = today();
  const createdAt = now();
  return {
    members: [
      { id: demoAdmin.id, email: demoAdmin.email, displayName: demoAdmin.displayName, role: demoAdmin.role, status: "ACTIVE", createdAt, updatedAt: createdAt },
      { id: "u_linh", email: "linh@goldenbird.local", displayName: "Linh", role: "MEMBER", status: "ACTIVE", createdAt, updatedAt: createdAt },
      { id: "u_minh", email: "minh@goldenbird.local", displayName: "Minh", role: "MEMBER", status: "ACTIVE", createdAt, updatedAt: createdAt },
      { id: "u_huy", email: "huy@goldenbird.local", displayName: "Huy", role: "MEMBER", status: "ACTIVE", createdAt, updatedAt: createdAt },
    ],
    lunchEntries: [
      { userId: "u_linh", status: "EAT_OUT", restaurantName: "Cơm gà Golden", foodName: "Cơm gà xối mỡ", note: "Ít cay" },
      { userId: "u_minh", status: "BRING_LUNCH", restaurantName: "", foodName: "", note: "Có trái cây chia team" },
      { userId: "u_huy", status: "EAT_OUT", restaurantName: "Bún bò Sân Nhà", foodName: "Bún bò tái", note: "" },
    ],
    posts: [
      {
        id: "post_seed",
        lunchDate: date,
        author: { id: "u_linh", displayName: "Linh" },
        content: "Team ăn ngoài chốt 11:45 nhé. Ai theo kèo cơm gà thì thả tim.",
        reactionSummary: { LIKE: 2, LOVE: 1, ANGRY: 0 },
        myReaction: null,
        commentCount: 1,
        comments: [],
        createdAt,
        canDelete: false,
      },
    ],
    comments: [
      {
        id: "comment_seed",
        postId: "post_seed",
        author: { id: "u_minh", displayName: "Minh" },
        content: "Cho mình ké một phần không hành.",
        reactionSummary: emptyReactions(),
        myReaction: null,
        createdAt,
        canDelete: false,
      },
    ],
    emailLogs: [],
    reactions: {},
    wcSlots: [],
    wcRequests: [],
  };
}

function activeWcRequest(state: MockState): WcRequest | null {
  const nowMs = Date.now();
  return (
    state.wcRequests
      .filter((request) => request.status === "OPEN" && Date.parse(request.expiresAt) > nowMs)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

function expireOldWcRequests(requests: WcRequest[]) {
  const nowMs = Date.now();
  return requests.map((request) => (request.status === "OPEN" && Date.parse(request.expiresAt) <= nowMs ? { ...request, status: "CLOSED" as const } : request));
}

function parsePath(path: string) {
  const url = new URL(path, "https://mock.local");
  return { endpoint: url.pathname.replace(/^\//, ""), searchParams: url.searchParams };
}

function readBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof body !== "string" || !body) return {};
  return JSON.parse(body) as Record<string, unknown>;
}

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
