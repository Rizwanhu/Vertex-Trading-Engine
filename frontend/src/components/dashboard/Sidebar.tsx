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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "dash-sidebar fixed lg:static inset-y-0 left-0 z-50 flex flex-col",
          "transition-all duration-300 ease-out shrink-0",
          collapsed ? "w-[4.25rem] lg:w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--auth-border)]">
          <div className="auth-brand-dot shrink-0 !w-10 !h-10" />
          {expanded && (
            <div className="min-w-0 flex-1 auth-brand !gap-0">
              <span className="auth-brand-name">AlgoTrader</span>
              <p className="text-[10px] font-bold tracking-[0.2em] mt-1" style={{ color: "var(--auth-accent)" }}>
                PRO
              </p>
            </div>
          )}
          {mobileOpen && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-2 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                title={!expanded ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--auth-radius)] text-sm font-medium transition-all duration-200 border",
                  isActive
                    ? "text-[var(--auth-accent)] bg-[var(--auth-accent-dim)] border-[rgba(0,255,163,0.25)] shadow-[0_0_20px_rgba(0,255,163,0.08)]"
                    : "text-[var(--auth-label)] border-transparent hover:text-[var(--auth-text)] hover:bg-white/[0.04]",
                )}
              >
                <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {expanded && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t border-[var(--auth-border)] space-y-1">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--auth-radius)] text-sm text-[var(--auth-label)] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-all"
          >
            <LogOut size={18} />
            {expanded && <span>Log out</span>}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.04] text-xs"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="ml-1">Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
