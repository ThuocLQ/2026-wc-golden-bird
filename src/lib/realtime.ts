import { useEffect, useRef } from "react";

const eventName = "lunch-board:data-changed";
const channelName = "lunch-board-realtime";

type RealtimeMessage = {
  source: string;
  path: string;
  at: number;
};

const sourceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(channelName) : null;

export function notifyDataChanged(path: string) {
  const message: RealtimeMessage = { source: sourceId, path, at: Date.now() };
  window.dispatchEvent(new CustomEvent(eventName, { detail: message }));
  channel?.postMessage(message);
}

export function useRealtimeRefresh(onRefresh: () => void | Promise<void>, intervalMs = 8000) {
  const callbackRef = useRef(onRefresh);
  const busyRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    async function refresh() {
      if (busyRef.current || document.visibilityState !== "visible") return;
      busyRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        busyRef.current = false;
      }
    }

    function onLocalEvent() {
      void refresh();
    }

    function onChannelEvent(event: MessageEvent<RealtimeMessage>) {
      if (event.data?.source !== sourceId) void refresh();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void refresh();
    }

    window.addEventListener(eventName, onLocalEvent);
    channel?.addEventListener("message", onChannelEvent);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const timer = window.setInterval(refresh, intervalMs);

    return () => {
      window.removeEventListener(eventName, onLocalEvent);
      channel?.removeEventListener("message", onChannelEvent);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(timer);
    };
  }, [intervalMs]);
}
