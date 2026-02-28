import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  DoorOpen,
  Wrench,
  FileText,
  MessageSquareMore,
  ScrollText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";
import fscapeLogo from "@/assets/fscape-logo.svg";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/accounts", icon: Users, label: "Tài khoản" },
  { to: "/buildings", icon: Building2, label: "Tòa nhà" },
  { to: "/rooms", icon: DoorOpen, label: "Phòng" },
  { to: "/facilities", icon: Wrench, label: "Tiện ích" },
  { to: "/contracts", icon: FileText, label: "Hợp đồng" },
  { to: "/requests", icon: MessageSquareMore, label: "Yêu cầu" },
  { to: "/logs", icon: ScrollText, label: "Nhật ký" },
];

export default function AppSidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-4">
      {/* Logo */}
      <NavLink to="/" className="mb-6">
        <img src={fscapeLogo} alt="FScape" className="size-9" />
      </NavLink>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            title={item.label}
            className={({ isActive }) =>
              cn(
                "group relative flex size-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="size-5" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        title="Đăng xuất"
        className="group relative flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-5" />
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Đăng xuất
        </span>
      </button>
    </aside>
  );
}
