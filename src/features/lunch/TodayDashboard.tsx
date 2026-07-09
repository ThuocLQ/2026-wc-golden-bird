import { AvatarName, AvatarStack } from "../../components/AvatarStack";
import { StatusBadge } from "../../components/StatusBadge";
import type { LunchPerson, TodayDashboardData } from "./types";

const cards = [
  ["totalMembers", "Tổng thành viên", "all"],
  ["bringLunchCount", "Mang cơm", "bringLunch"],
  ["eatOutCount", "Ăn ngoài", "eatOut"],
  ["noLunchCount", "Không ăn", "noLunch"],
  ["undecidedCount", "Chưa quyết", "undecided"],
] as const;

export function TodayDashboard({ data }: { data: TodayDashboardData }) {
  return (
    <div className="stack">
      <section className="stats">
        {cards.map(([key, label, group], index) => (
          <div className={`stat stat-${key}`} key={key}>
            <small>#{index + 1}</small>
            <span>{label}</span>
            <strong>{data.summary[key]}</strong>
            <AvatarStack people={peopleForStat(data, group)} />
          </div>
        ))}
      </section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Team Lineup</span>
          <h2>Phân đội bữa trưa</h2>
        </div>
      </div>
      <div className="grid two">
        <PersonList title="Đi ăn ngoài" people={data.groups.eatOut} />
        <PersonList title="Mang cơm" people={data.groups.bringLunch} />
        <PersonList title="Không ăn" people={data.groups.noLunch} />
        <PersonList title="Chưa quyết" people={data.groups.undecided} />
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Hot Picks</span>
          <h2>Quán và món đang lên</h2>
        </div>
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
      <div className="panel-title">
        <h2>{title}</h2>
        <span className="mini-badge">{people.length}</span>
      </div>
      {people.length === 0 ? (
        <p className="muted">Chưa có ai.</p>
      ) : (
        <div className="list">
          {people.map((person) => (
            <div className="list-item" key={person.userId}>
              <div>
                <AvatarName name={person.displayName} />
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

function peopleForStat(data: TodayDashboardData, group: (typeof cards)[number][2]): LunchPerson[] {
  if (group === "all") return [...data.groups.eatOut, ...data.groups.bringLunch, ...data.groups.noLunch, ...data.groups.undecided, ...data.groups.notUpdated];
  return data.groups[group];
}

function TopList({ title, items }: { title: string; items: Array<{ name: string; count: number }> }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{title}</h2>
        <span className="mini-badge">{items.length}</span>
      </div>
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
