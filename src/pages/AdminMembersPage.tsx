import { useEffect, useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import { createMember, disableMember, listMembers, setPin } from "../features/admin/adminApi";
import type { Member } from "../features/admin/types";
import { useRealtimeSync } from "../lib/realtime";

export function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", displayName: "", role: "MEMBER" as "ADMIN" | "MEMBER", pin: "" });

  async function load() {
    setError("");
    try {
      setMembers(await listMembers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useRealtimeSync("members", load, 12000);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await createMember(form);
    setForm({ email: "", displayName: "", role: "MEMBER", pin: "" });
    await load();
  }

  async function resetPin(userId: string) {
    const pin = window.prompt("PIN mới");
    if (!pin) return;
    await setPin(userId, pin);
  }

  return (
    <div className="stack">
      <header className="page-header">
        <h1>Members</h1>
        <button type="button" className="secondary" onClick={load}>
          Làm mới
        </button>
      </header>
      {error && <ErrorMessage message={error} />}
      <form className="panel form" onSubmit={submit}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">New Player</span>
            <h2>Tạo member</h2>
          </div>
        </div>
        <div className="grid four">
          <label>
            Email
            <input value={form.email} type="email" onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            Tên
            <input value={form.displayName} maxLength={100} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "ADMIN" | "MEMBER" })}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label>
            PIN
            <input value={form.pin} type="password" minLength={4} maxLength={20} onChange={(event) => setForm({ ...form, pin: event.target.value })} required />
          </label>
        </div>
        <button type="submit">Tạo member</button>
      </form>
      <section className="panel">
        <div className="panel-title">
          <h2>Danh sách</h2>
          <span className="mini-badge">{members.length}</span>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="table">
            {members.map((member) => (
              <div className="table-row" key={member.id}>
                <div>
                  <strong>{member.displayName}</strong>
                  <div className="muted">{member.email}</div>
                </div>
                <StatusBadge value={member.role} />
                <StatusBadge value={member.status} />
                <div className="row end">
                  <button type="button" className="secondary" onClick={() => resetPin(member.id)}>
                    Reset PIN
                  </button>
                  <button type="button" className="danger" disabled={member.status === "DISABLED"} onClick={() => disableMember(member.id).then(load)}>
                    Disable
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
