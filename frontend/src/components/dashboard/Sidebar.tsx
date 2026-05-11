"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Bot, BarChart3,
  Settings, ChevronLeft, ChevronRight, Zap, Wallet
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { label: "Dashboard",   href: "/dashboard",            icon: LayoutDashboard },
  { label: "Trade",       href: "/dashboard/trade",       icon: TrendingUp },
  { label: "Portfolio",   href: "/dashboard/portfolio",   icon: Wallet },
  { label: "Bots",        href: "/dashboard/bots",        icon: Bot },
  { label: "Analytics",   href: "/dashboard/analytics",   icon: BarChart3 },
  { label: "Settings",    href: "/dashboard/settings",    icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "flex flex-col bg-bg-secondary border-r border-bg-border transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-bg-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-text-primary leading-none">AlgoTrader</p>
            <p className="text-[10px] text-brand mt-0.5">PRO</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-brand bg-brand/10 border border-brand/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="px-2 py-4 border-t border-bg-border">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="ml-2 text-xs">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
