import { useEffect, useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { getToday } from "../features/lunch/lunchApi";
import { LunchStatusForm } from "../features/lunch/LunchStatusForm";
import { TodayDashboard } from "../features/lunch/TodayDashboard";
import type { TodayDashboardData } from "../features/lunch/types";
import { displayDate } from "../lib/date";

export function TodayPage() {
  const [data, setData] = useState<TodayDashboardData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setData(await getToday());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dashboard");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Hôm nay</h1>
          <p className="muted">{displayDate(data.date)}</p>
        </div>
        <button className="secondary" onClick={load}>
          Làm mới
        </button>
      </header>
      <LunchStatusForm data={data} onSaved={load} />
      <TodayDashboard data={data} />
    </div>
  );
}
