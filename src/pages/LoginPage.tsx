import { LockKeyhole, Mail, Trophy } from "lucide-react";
import { useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { login } from "../features/auth/authApi";
import { authStore } from "../features/auth/authStore";
import type { CurrentUser } from "../features/auth/types";
import { demoAdmin } from "../lib/demoAccounts";
import { isMockApiEnabled } from "../lib/mockMode";

export function LoginPage({ onLogin }: { onLogin: (user: CurrentUser) => void }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const mockMode = isMockApiEnabled();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await login(email, pin);
      authStore.set(result.token, result.user);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="brand-mark large">
            <Trophy size={24} />
          </div>
          <span className="eyebrow">World Cup 2026 Internal</span>
          <h1>Golden Bird Lunch Cup</h1>
          <p className="muted">Check-in bữa trưa, chốt quán và sắp xếp vị trí đá wc trong vài giây</p>
        </div>
        {mockMode && (
          <div className="notice">
            Demo admin: <strong>{demoAdmin.email}</strong> / PIN <strong>{demoAdmin.pin}</strong>
          </div>
        )}
        {error && <ErrorMessage message={error} />}
        <label>
          Email
          <span className="input-shell">
            <Mail size={18} />
            <input value={email} type="email" autoComplete="email" onChange={(event) => setEmail(event.target.value)} required />
          </span>
        </label>
        <label>
          PIN
          <span className="input-shell">
            <LockKeyhole size={18} />
            <input value={pin} type="password" autoComplete="current-password" minLength={4} maxLength={20} onChange={(event) => setPin(event.target.value)} required />
          </span>
        </label>
        <button disabled={saving}>{saving ? "Đang vào..." : "Đăng nhập"}</button>
      </form>
    </main>
  );
}
