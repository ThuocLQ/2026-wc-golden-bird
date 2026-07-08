import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { Loading } from "./components/Loading";
import { me } from "./features/auth/authApi";
import { authStore } from "./features/auth/authStore";
import type { CurrentUser } from "./features/auth/types";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage";
import { FeedPage } from "./pages/FeedPage";
import { LoginPage } from "./pages/LoginPage";
import { TodayPage } from "./pages/TodayPage";

function currentPath() {
  return window.location.pathname === "/" ? "/today" : window.location.pathname;
}

export default function App() {
  const [user, setUser] = useState<CurrentUser | null>(authStore.getUser());
  const [path, setPath] = useState(currentPath());
  const [checking, setChecking] = useState(Boolean(authStore.getToken()));

  useEffect(() => {
    function onPopState() {
      setPath(currentPath());
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!authStore.getToken()) {
      setChecking(false);
      navigate("/login", true);
      return;
    }
    me()
      .then((currentUser) => {
        authStore.setUser(currentUser);
        setUser(currentUser);
        if (path === "/login") navigate("/today", true);
      })
      .catch(() => {
        authStore.clear();
        setUser(null);
        navigate("/login", true);
      })
      .finally(() => setChecking(false));
  }, []);

  function navigate(nextPath: string, replace = false) {
    if (window.location.pathname !== nextPath) {
      if (replace) window.history.replaceState({}, "", nextPath);
      else window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
  }

  function logout() {
    authStore.clear();
    setUser(null);
    navigate("/login");
  }

  if (checking) return <Loading label="Đang kiểm tra phiên đăng nhập..." />;
  if (!user || path === "/login") return <LoginPage onLogin={(nextUser) => { setUser(nextUser); navigate("/today"); }} />;

  const isAdminPath = path.startsWith("/admin");
  const content = isAdminPath && user.role !== "ADMIN" ? <div className="error">Forbidden</div> : route(path);

  return (
    <Layout user={user} path={path} onNavigate={navigate} onLogout={logout}>
      {content}
    </Layout>
  );
}

function route(path: string) {
  if (path === "/feed") return <FeedPage />;
  if (path === "/admin/members") return <AdminMembersPage />;
  if (path === "/admin/notifications") return <AdminNotificationsPage />;
  return <TodayPage />;
}
