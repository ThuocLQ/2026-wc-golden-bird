import { Bell, CalendarDays, LogOut, Mail, MessageCircle, Sparkles, Users } from "lucide-react";
import type { CurrentUser } from "../features/auth/types";

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
    { path: "/today", label: "Hôm nay", icon: CalendarDays },
    { path: "/feed", label: "Feed", icon: MessageCircle },
    ...(user.role === "ADMIN"
      ? [
          { path: "/admin/members", label: "Members", icon: Users },
          { path: "/admin/notifications", label: "Email", icon: Mail },
        ]
      : []),
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="brand">Lunch Board</div>
            <div className="muted">{user.displayName}</div>
          </div>
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
      <main className="main">{children}</main>
    </div>
  );
}
