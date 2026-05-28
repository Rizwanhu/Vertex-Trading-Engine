"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  LogOut,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Trade", href: "/dashboard/trade", icon: TrendingUp },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Wallet },
  { label: "Bots", href: "/dashboard/bots", icon: Bot },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const expanded = !collapsed || mobileOpen;

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="dash-sidebar-backdrop lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "dash-sidebar",
          collapsed && !mobileOpen && "is-collapsed",
          mobileOpen && "is-open",
        )}
      >
        <div className="dash-sidebar-brand">
          <div className="auth-brand-dot" style={{ width: "2.5rem", height: "2.5rem" }} />
          {expanded && (
            <div className="dash-sidebar-brand-text">
              <span className="auth-brand-name">AlgoTrader</span>
              <span className="dash-sidebar-brand-pro">Pro</span>
            </div>
          )}
          {mobileOpen && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="dash-sidebar-close lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="dash-nav" aria-label="Main navigation">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                title={!expanded ? label : undefined}
                className={cn("dash-nav-link", isActive && "is-active")}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {expanded && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="dash-sidebar-btn dash-sidebar-btn--danger"
          >
            <LogOut size={18} />
            {expanded && <span>Log out</span>}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="dash-sidebar-btn dash-sidebar-btn--ghost hidden lg:flex"
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                {expanded && <span>Collapse</span>}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
