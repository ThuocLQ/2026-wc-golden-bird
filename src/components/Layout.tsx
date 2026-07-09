import { Bell, CalendarDays, DoorOpen, LogOut, Mail, MessageCircle, Trophy, Users } from "lucide-react";
import type { CurrentUser } from "../features/auth/types";
import { WcSignalBanner } from "./WcSignalBanner";

export function Layout({
  user,
  path,
  onNavigate,
  onLogout,
  children,
}: {
  user: CurrentUser;
  path: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const navItems = [
    { path: "/today", label: "Bữa trưa", icon: CalendarDays },
    { path: "/feed", label: "Sân bàn luận", icon: MessageCircle },
    { path: "/wc", label: "Đội hình WC", icon: DoorOpen },
    ...(user.role === "ADMIN"
      ? [
          { path: "/admin/members", label: "Đội hình", icon: Users },
          { path: "/admin/notifications", label: "Nhắc lịch", icon: Mail },
        ]
      : []),
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Trophy size={20} />
          </div>
          <div>
            <div className="brand">Golden Bird</div>
            <div className="brand-subtitle">Lunch Cup 2026</div>
          </div>
        </div>
        <div className="user-card">
          <span>Đang thi đấu</span>
          <strong>{user.displayName}</strong>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.path} className={path === item.path ? "nav active" : "nav"} onClick={() => onNavigate(item.path)}>
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="ghost-icon" title="Thông báo">
            <Bell size={18} />
          </button>
          <button className="secondary logout" onClick={onLogout}>
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="main">
        {path !== "/wc" && <WcSignalBanner user={user} onNavigate={onNavigate} />}
        {children}
      </main>
    </div>
  );
}
