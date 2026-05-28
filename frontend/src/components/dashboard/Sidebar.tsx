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
  Zap,
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
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col",
          "bg-bg-secondary/95 backdrop-blur-xl border-r border-white/[0.06]",
          "transition-all duration-300 ease-out shrink-0",
          collapsed ? "w-[4.25rem] lg:w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          {expanded && (
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-text-primary leading-none">AlgoTrader</p>
              <p className="text-[10px] text-brand font-bold tracking-[0.2em] mt-1">PRO</p>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "nav-glow bg-brand/10 text-brand border border-brand/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border border-transparent",
                )}
              >
                <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {expanded && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t border-white/[0.06] space-y-1">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-red-trade hover:bg-red-trade/10 transition-all"
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
