import { DoorOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { CurrentUser } from "../features/auth/types";
import { closeWcRequest, getWcState, joinWcRequest } from "../features/wc/wcApi";
import type { WcRequest } from "../features/wc/types";
import { useRealtimeSync } from "../lib/realtime";

export function WcSignalBanner({ user, onNavigate }: { user: CurrentUser; onNavigate: (path: string) => void }) {
  const [request, setRequest] = useState<WcRequest | null>(null);
  const [dismissedId, setDismissedId] = useState(localStorage.getItem("wc-dismissed-request-id"));
  const [saving, setSaving] = useState(false);

  async function load() {
    const state = await getWcState();
    setRequest(state.activeRequest);
  }

  useEffect(() => {
    load().catch(() => setRequest(null));
  }, []);

  useRealtimeSync("wc", load, 2500);

  if (!request || dismissedId === request.id) return null;

  const isRequester = request.requesterId === user.id;
  const joined = request.joinedUsers.some((item) => item.id === user.id);

  async function join() {
    if (!request) return;
    setSaving(true);
    try {
      await joinWcRequest(request.id);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function close() {
    if (!request) return;
    setSaving(true);
    try {
      await closeWcRequest(request.id);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function dismiss() {
    localStorage.setItem("wc-dismissed-request-id", request.id);
    setDismissedId(request.id);
  }

  return (
    <div className="wc-signal-banner">
      <div className="icon-orb">
        <DoorOpen size={20} />
      </div>
      <div>
        <strong>{isRequester ? "Bạn đang gọi team đi WC" : `${request.requesterName} muốn đi WC`}</strong>
        <p>
          {request.joinedUsers.length
            ? `${request.joinedUsers.map((item) => item.displayName).join(", ")} đã đi cùng.`
            : isRequester
              ? "Đang chờ đồng đội phản hồi."
              : "Bạn có đi cùng không?"}
        </p>
      </div>
      <div className="wc-signal-actions">
        {!isRequester && !joined && (
          <button disabled={saving} onClick={join}>
            Đi cùng
          </button>
        )}
        {isRequester && (
          <button className="secondary" disabled={saving} onClick={close}>
            Xong rồi
          </button>
        )}
        <button className="secondary" onClick={() => onNavigate("/wc")}>
          Mở đội hình
        </button>
        <button className="ghost-icon" title="Ẩn" onClick={dismiss}>
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
