import { NavLink } from "react-router-dom";
import { LayoutDashboard, Building2, DoorOpen, Users, CreditCard, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/buildings", icon: Building2, label: "Tòa nhà" },
  { to: "/rooms", icon: DoorOpen, label: "Phòng" },
  { to: "/users", icon: Users, label: "Sinh viên" },
  { to: "/payments", icon: CreditCard, label: "Thanh toán" },
  { to: "/settings", icon: Settings, label: "Cài đặt" },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "A";

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* User profile section */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/50">{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            {item.label}
            <item.icon className="size-4" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-sidebar-foreground/50 hover:text-sidebar-foreground"
          onClick={logout}
        >
          Đăng xuất
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
