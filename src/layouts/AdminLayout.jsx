import { Outlet } from "react-router-dom";
import { Search } from "lucide-react";
import AppSidebar from "../components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "A";

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
            <Search className="size-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-48 bg-transparent outline-none placeholder:text-muted-foreground/60 lg:w-72"
            />
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
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
