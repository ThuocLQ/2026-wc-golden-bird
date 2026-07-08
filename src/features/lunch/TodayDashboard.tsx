import { StatusBadge } from "../../components/StatusBadge";
import type { LunchPerson, TodayDashboardData } from "./types";

const cards = [
  ["totalMembers", "Tổng members"],
  ["updatedCount", "Đã cập nhật"],
  ["notUpdatedCount", "Chưa cập nhật"],
  ["bringLunchCount", "Mang cơm"],
  ["eatOutCount", "Ăn ngoài"],
  ["noLunchCount", "Không ăn"],
  ["undecidedCount", "Chưa quyết"],
] as const;

export function TodayDashboard({ data }: { data: TodayDashboardData }) {
  return (
    <div className="stack">
      <section className="stats">
        {cards.map(([key, label]) => (
          <div className="stat" key={key}>
            <span>{label}</span>
            <strong>{data.summary[key]}</strong>
          </div>
        ))}
      </section>
      <div className="grid two">
        <PersonList title="Đi ăn ngoài" people={data.groups.eatOut} />
        <PersonList title="Mang cơm" people={data.groups.bringLunch} />
        <PersonList title="Không ăn" people={data.groups.noLunch} />
        <PersonList title="Chưa cập nhật" people={data.groups.notUpdated} />
      </div>
      <div className="grid two">
        <TopList title="Top quán" items={data.topRestaurants} />
        <TopList title="Top món" items={data.topFoods} />
      </div>
    </div>
  );
}

function PersonList({ title, people }: { title: string; people: LunchPerson[] }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {people.length === 0 ? (
        <p className="muted">Chưa có ai.</p>
      ) : (
        <div className="list">
          {people.map((person) => (
            <div className="list-item" key={person.userId}>
              <div>
                <strong>{person.displayName}</strong>
                {(person.restaurantName || person.foodName || person.note) && (
                  <div className="muted">
                    {[person.restaurantName, person.foodName, person.note].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              {person.status && <StatusBadge value={person.status} />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TopList({ title, items }: { title: string; items: Array<{ name: string; count: number }> }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted">Chưa có dữ liệu.</p>
      ) : (
        <div className="list">
          {items.map((item) => (
            <div className="list-item" key={item.name}>
              <strong>{item.name}</strong>
              <span className="badge">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
