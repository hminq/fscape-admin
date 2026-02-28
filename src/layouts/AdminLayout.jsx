import { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import AppSidebar from "../components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "A";

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
      <AppSidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-border bg-background px-6">
          {/* User profile + dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown panel */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
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
