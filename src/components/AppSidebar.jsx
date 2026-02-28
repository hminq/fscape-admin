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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
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

export default function AppSidebar({ expanded, onToggle }) {
  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar py-4 transition-all duration-300",
        expanded ? "w-52" : "w-16"
      )}
    >
      {/* Logo + toggle */}
      <div
        className={cn(
          "flex items-center mb-6",
          expanded ? "justify-between px-4" : "justify-center"
        )}
      >
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={fscapeLogo} alt="FScape" className="size-9" />
          {expanded && (
            <span className="text-xl font-display tracking-wide text-sidebar-foreground leading-none translate-y-px">
              FSCAPE
            </span>
          )}
        </NavLink>
        {expanded && (
          <button
            onClick={onToggle}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {/* Collapse button when collapsed */}
      {!expanded && (
        <button
          onClick={onToggle}
          className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <PanelLeftOpen className="size-5" />
        </button>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1",
          expanded ? "px-3" : "items-center"
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            title={!expanded ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center rounded-lg transition-colors",
                expanded
                  ? "gap-3 px-3 py-2.5 text-sm"
                  : "size-10 justify-center",
                isActive
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="size-5 shrink-0" />
            {expanded && <span>{item.label}</span>}
            {/* Tooltip — only when collapsed */}
            {!expanded && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
