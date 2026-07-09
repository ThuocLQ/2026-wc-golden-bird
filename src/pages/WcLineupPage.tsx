import { DoorOpen, Footprints, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { AvatarName } from "../components/AvatarStack";
import { Loading } from "../components/Loading";
import { authStore } from "../features/auth/authStore";
import { claimWcSlot, closeWcRequest, createWcRequest, getWcState, joinWcRequest } from "../features/wc/wcApi";
import type { WcState } from "../features/wc/types";
import { useRealtimeSync } from "../lib/realtime";

const slotNumbers = [1, 2, 3, 4, 5];

export function WcLineupPage() {
  const [state, setState] = useState<WcState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const user = authStore.getUser();

  async function load() {
    setError("");
    try {
      setState(await getWcState());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được đội hình WC");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useRealtimeSync("wc", load, 6000);

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xử lý được");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorMessage message={error} />;
  if (!state) return <Loading />;

  const mySlot = state.slots.find((slot) => slot.userId === user?.id);
  const request = state.activeRequest;
  const isRequester = request?.requesterId === user?.id;
  const joined = request?.joinedUsers.some((item) => item.id === user?.id);

  return (
    <div className="stack">
      <header className="page-header match-header">
        <div>
          <span className="eyebrow">WC Lineup</span>
          <div className="title-row">
            <h1>Xếp đội hình WC</h1>
            <span className="live-pill">Near live</span>
          </div>
          <p className="muted">Chọn 1 trong 5 ô, bấm gọi team khi muốn đi WC.</p>
        </div>
        <button className="secondary icon-text" onClick={load}>
          <RefreshCw size={18} />
          <span>Làm mới</span>
        </button>
      </header>

      {request && (
        <section className="wc-callout">
          <div className="icon-orb">
            <DoorOpen size={22} />
          </div>
          <div>
            <strong>{request.requesterName} muốn đi WC</strong>
            <p>{request.joinedUsers.length ? `${request.joinedUsers.map((item) => item.displayName).join(", ")} đi cùng.` : "Chưa có ai đi cùng."}</p>
          </div>
          <div className="wc-callout-actions">
            {!isRequester && !joined && (
              <button disabled={saving} onClick={() => run(() => joinWcRequest(request.id))}>
                Đi cùng
              </button>
            )}
            {isRequester && (
              <button className="secondary" disabled={saving} onClick={() => run(() => closeWcRequest(request.id))}>
                Xong rồi
              </button>
            )}
          </div>
        </section>
      )}

      <section className="panel form">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Five Slots</span>
            <h2>5 ô đội hình</h2>
          </div>
          <span className="mini-badge">{mySlot ? `Bạn ở ô ${mySlot.slotNumber}` : "Chưa chọn ô"}</span>
        </div>
        <div className="wc-slots">
          {slotNumbers.map((slotNumber) => {
            const slot = state.slots.find((item) => item.slotNumber === slotNumber);
            const mine = slot?.userId === user?.id;
            return (
              <button
                className={mine ? "wc-slot mine" : slot ? "wc-slot occupied" : "wc-slot"}
                disabled={saving}
                key={slotNumber}
                onClick={() => run(() => claimWcSlot(slotNumber))}
              >
                <span className="wc-slot-number">{slotNumber}</span>
                {slot && <span className="avatar-dot wc-slot-avatar">{initialsName(slot.displayName)}</span>}
                <strong>{slot?.displayName ?? "Trống"}</strong>
                <small>{mine ? "Vị trí của bạn" : slot ? "Đã có người" : "Bấm để chọn"}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel wc-action-panel">
        <div>
          <span className="eyebrow">Signal</span>
          <h2>Gọi đồng đội</h2>
          <p className="muted">Tín hiệu sẽ hiện ở các màn hình khác đang mở app.</p>
        </div>
        <button className="icon-text" disabled={saving || Boolean(request && !isRequester)} onClick={() => run(createWcRequest)}>
          <Footprints size={18} />
          <span>Muốn đi WC</span>
        </button>
      </section>

      <section className="grid two">
        <div className="panel">
          <div className="panel-title">
            <h2>Đang trong đội hình</h2>
            <span className="mini-badge">{state.slots.length}/5</span>
          </div>
          <div className="list">
            {state.slots.length ? (
              state.slots.map((slot) => (
                <div className="list-item" key={slot.slotNumber}>
                  <div className="icon-text">
                    <ShieldCheck size={18} />
                    <strong>Ô {slot.slotNumber}</strong>
                  </div>
                  <AvatarName name={slot.displayName} />
                </div>
              ))
            ) : (
              <p className="muted">Chưa ai chọn ô.</p>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <h2>Đi cùng</h2>
            <span className="mini-badge">{request?.joinedUsers.length ?? 0}</span>
          </div>
          {request?.joinedUsers.length ? (
            <div className="list">
              {request.joinedUsers.map((item) => (
                <div className="list-item" key={item.id}>
                  <div className="icon-text">
                    <Users size={18} />
                    <AvatarName name={item.displayName} />
                  </div>
                  <span className="badge badge-active">Ready</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Chưa có lời gọi đang được join.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function initialsName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
