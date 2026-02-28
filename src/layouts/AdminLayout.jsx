import { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { LogOut, User, Shield, CalendarDays } from "lucide-react";
import AppSidebar from "../components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import defaultUserImg from "@/assets/default_user_img.jpg";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Outside click to close user menu
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-border bg-background px-6">
          {/* Date badge */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>

          {/* Avatar — click to open menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="rounded-lg transition-opacity hover:opacity-80"
            >
              <img
                src={defaultUserImg}
                alt={user?.name}
                className="size-9 rounded-lg object-cover ring-1 ring-border"
              />
            </button>

            {/* Dropdown panel */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-popover shadow-lg">
                {/* User info card */}
                <div className="flex items-center gap-3 px-4 py-4">
                  <img
                    src={defaultUserImg}
                    alt={user?.name}
                    className="size-11 rounded-lg object-cover shrink-0 ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Info row */}
                <div className="border-t border-border px-4 py-3">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Shield className="size-3.5 shrink-0" />
                    <span>{user?.role}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-border p-1">
                  <button
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <User className="size-4" />
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
