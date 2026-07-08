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
    { path: "/today", label: "Hôm nay" },
    { path: "/feed", label: "Feed" },
    ...(user.role === "ADMIN"
      ? [
          { path: "/admin/members", label: "Members" },
          { path: "/admin/notifications", label: "Email" },
        ]
      : []),
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Lunch Board</div>
          <div className="muted">{user.displayName}</div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.path} className={path === item.path ? "nav active" : "nav"} onClick={() => onNavigate(item.path)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button className="secondary" onClick={onLogout}>
          Đăng xuất
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
