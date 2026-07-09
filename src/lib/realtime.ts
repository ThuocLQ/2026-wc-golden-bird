import { useEffect, useRef } from "react";
import { authStore } from "../features/auth/authStore";
import { hasActiveMutation } from "./apiActivity";
import { isMockApiEnabled } from "./mockMode";

const eventName = "lunch-board:data-changed";
const channelName = "lunch-board-realtime";
type ChangeResource = "today" | "feed" | "comments" | "members" | "notifications" | "wc";

type RealtimeMessage = {
  source: string;
  path: string;
  resources: ChangeResource[];
  at: number;
};

const sourceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(channelName) : null;

export function notifyDataChanged(path: string) {
  const message: RealtimeMessage = { source: sourceId, path, resources: resourcesForPath(path), at: Date.now() };
  window.dispatchEvent(new CustomEvent(eventName, { detail: message }));
  channel?.postMessage(message);
}

export function useRealtimeSync(resource: ChangeResource, onRefresh: () => void | Promise<void>, intervalMs = 25000) {
  const callbackRef = useRef(onRefresh);
  const busyRef = useRef(false);
  const versionRef = useRef(0);

  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    async function refresh(force = false) {
      if (busyRef.current || document.visibilityState !== "visible" || isEditingText() || hasActiveMutation()) return;
      busyRef.current = true;
      try {
        if (isMockApiEnabled() && !force) return;
        if (!force) {
          const changes = await getChanges(versionRef.current);
          versionRef.current = Math.max(versionRef.current, changes.version, changes.versions[resource] ?? 0);
          if (!changes.changed.includes(resource)) return;
        }
        await callbackRef.current();
      } finally {
        busyRef.current = false;
      }
    }

    function onLocalEvent(event: Event) {
      const detail = (event as CustomEvent<RealtimeMessage>).detail;
      if (detail?.resources.includes(resource)) void refresh(true);
    }

    function onChannelEvent(event: MessageEvent<RealtimeMessage>) {
      if (event.data?.source !== sourceId && event.data?.resources.includes(resource)) void refresh(true);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void refresh(false);
    }

    window.addEventListener(eventName, onLocalEvent);
    channel?.addEventListener("message", onChannelEvent);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const timer = window.setInterval(() => refresh(false), intervalMs);

    return () => {
      window.removeEventListener(eventName, onLocalEvent);
      channel?.removeEventListener("message", onChannelEvent);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(timer);
    };
  }, [intervalMs, resource]);
}

async function getChanges(since: number): Promise<{ version: number; versions: Record<ChangeResource, number>; changed: ChangeResource[] }> {
  const token = authStore.getToken();
  const response = await fetch(`/api/changes-get?since=${since}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await response.text();
  if (!text) throw new Error(`changes-get returned an empty response (${response.status})`);
  let result: { success: boolean; error?: { message?: string }; data: { version: number; versions: Record<ChangeResource, number>; changed: ChangeResource[] } };
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`changes-get did not return valid JSON (${response.status})`);
  }
  if (!result.success) throw new Error(result.error?.message ?? "Could not read changes");
  return result.data;
}

function resourcesForPath(path: string): ChangeResource[] {
  if (path.startsWith("wc-")) return ["wc"];
  if (path.startsWith("lunch-entry")) return ["today"];
  if (path.startsWith("posts")) return ["feed"];
  if (path.startsWith("comments")) return ["feed", "comments"];
  if (path.startsWith("reactions")) return ["feed", "comments"];
  if (path.startsWith("admin-member") || path.startsWith("admin-set-pin")) return ["today", "members"];
  if (path.startsWith("email")) return ["notifications"];
  return ["today", "feed", "comments", "members", "notifications"];
}

function isEditingText(): boolean {
  const element = document.activeElement;
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || element.getAttribute("contenteditable") === "true";
}
