"use client";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked?: boolean;
  onChange?: () => void;
  className?: string;
}

export function ToggleSwitch({ checked = true, onChange, className }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative w-12 h-7 rounded-full transition-all duration-300 shrink-0",
        checked ? "bg-gradient-brand shadow-[0_0_16px_rgba(59,130,246,0.4)]" : "bg-bg-secondary border border-white/[0.08]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
          checked ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}
