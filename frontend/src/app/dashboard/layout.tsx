"use client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dash-theme dash-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="dash-main-column">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="dash-main">
          <AuthGuard>
            <div className="dash-page">{children}</div>
          </AuthGuard>
        </main>
      </div>
    </div>
  );
}
