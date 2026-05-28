"use client";
import { cn } from "@/lib/utils";

interface DashToggleProps {
  checked?: boolean;
  onChange?: () => void;
  className?: string;
  "aria-label"?: string;
}

export function DashToggle({
  checked = false,
  onChange,
  className,
  "aria-label": ariaLabel,
}: DashToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={cn("dash-toggle", checked && "dash-toggle-on", className)}
    >
      <span className="dash-toggle-thumb" />
    </button>
  );
}
