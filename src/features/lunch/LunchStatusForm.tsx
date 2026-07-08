import { useEffect, useState } from "react";
import { upsertLunchEntry } from "./lunchApi";
import type { LunchStatus, TodayDashboardData } from "./types";

const options: Array<{ value: LunchStatus; label: string }> = [
  { value: "BRING_LUNCH", label: "Mang cơm" },
  { value: "EAT_OUT", label: "Đi ăn ngoài" },
  { value: "NO_LUNCH", label: "Không ăn / không tham gia" },
  { value: "UNDECIDED", label: "Chưa quyết định" },
];

export function LunchStatusForm({ data, onSaved }: { data: TodayDashboardData; onSaved: () => void }) {
  const [status, setStatus] = useState<LunchStatus>(data.me.status);
  const [restaurantName, setRestaurantName] = useState(data.me.restaurantName);
  const [foodName, setFoodName] = useState(data.me.foodName);
  const [note, setNote] = useState(data.me.note);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dirty) return;
    setStatus(data.me.status);
    setRestaurantName(data.me.restaurantName);
    setFoodName(data.me.foodName);
    setNote(data.me.note);
  }, [data, dirty]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await upsertLunchEntry({ status, restaurantName, foodName, note });
      setDirty(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Trưa nay của tôi</h2>
      <div className="radio-grid">
        {options.map((option) => (
          <label key={option.value} className={status === option.value ? "choice selected" : "choice"}>
            <input type="radio" name="status" value={option.value} checked={status === option.value} onChange={() => { setStatus(option.value); setDirty(true); }} />
            {option.label}
          </label>
        ))}
      </div>
      {status === "EAT_OUT" && (
        <div className="grid two">
          <label>
            Quán
            <input value={restaurantName} maxLength={100} onChange={(event) => { setRestaurantName(event.target.value); setDirty(true); }} placeholder="VD: Cơm gà A" />
          </label>
          <label>
            Món
            <input value={foodName} maxLength={100} onChange={(event) => { setFoodName(event.target.value); setDirty(true); }} placeholder="VD: Cơm gà xối mỡ" />
          </label>
        </div>
      )}
      <label>
        Ghi chú
        <textarea value={note} maxLength={500} onChange={(event) => { setNote(event.target.value); setDirty(true); }} placeholder="Không hành, ít cay..." />
      </label>
      <button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu trạng thái"}</button>
    </form>
  );
}
