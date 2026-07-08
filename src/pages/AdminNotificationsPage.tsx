import { useEffect, useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { listEmailLogs, sendReminder } from "../features/admin/adminApi";
import type { EmailLog } from "../features/admin/types";
import { displayTime } from "../lib/date";

export function AdminNotificationsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setLogs(await listEmailLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được email logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remind() {
    setSending(true);
    setMessage("");
    setError("");
    try {
      const result = await sendReminder();
      setMessage(`Đã gửi ${result.sentCount}, lỗi ${result.failedCount}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được reminder");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Reminder Booth</span>
          <h1>Email nhắc lịch</h1>
        </div>
        <button disabled={sending} onClick={remind}>
          {sending ? "Đang gửi..." : "Gửi reminder ngay"}
        </button>
      </header>
      {message && <div className="notice success">{message}</div>}
      {error && <ErrorMessage message={error} />}
      <section className="panel">
        <div className="panel-title">
          <h2>50 email gần nhất</h2>
          <span className="mini-badge">{logs.length}</span>
        </div>
        {loading ? (
          <Loading />
        ) : logs.length === 0 ? (
          <p className="muted">Chưa có log.</p>
        ) : (
          <div className="list">
            {logs.map((log) => (
              <div className="list-item" key={log.id}>
                <div>
                  <strong>{log.recipientEmail}</strong>
                  <div className="muted">
                    {log.subject} · {displayTime(log.createdAt)}
                  </div>
                  {log.errorMessage && <div className="error compact">{log.errorMessage}</div>}
                </div>
                <span className={`badge badge-${log.status.toLowerCase()}`}>{log.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
