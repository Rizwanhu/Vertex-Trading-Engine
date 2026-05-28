"use client";
import { Loader2 } from "lucide-react";

interface DashLoadingProps {
  label?: string;
}

export function DashLoading({ label = "Loading…" }: DashLoadingProps) {
  return (
    <div className="dash-loading-state">
      <Loader2 size={36} className="dash-loading-spinner" />
      <p className="dash-loading-label">{label}</p>
    </div>
  );
}
