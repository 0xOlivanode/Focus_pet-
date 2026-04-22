import React from "react";
import { Moon, Zap, Flame } from "lucide-react";

type BoostVariant = "night" | "xp" | "streak" | "supercharge";

const CONFIG: Record<
  BoostVariant,
  { icon: React.ReactNode; defaultLabel: string; classes: string }
> = {
  night: {
    icon: <Moon className="w-3 h-3 shrink-0" />,
    defaultLabel: "Night Owl · 1.1×",
    classes: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  },
  xp: {
    icon: <Zap className="w-3 h-3 shrink-0" fill="currentColor" />,
    defaultLabel: "2× XP Boost",
    classes: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  streak: {
    icon: <Flame className="w-3 h-3 shrink-0" />,
    defaultLabel: "Streak Bonus",
    classes: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  },
  supercharge: {
    icon: <Zap className="w-3 h-3 shrink-0" fill="currentColor" />,
    defaultLabel: "Supercharged",
    classes: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  },
};

export function BoostBadge({
  variant,
  label,
}: {
  variant: BoostVariant;
  label?: string;
}) {
  const { icon, defaultLabel, classes } = CONFIG[variant];
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shrink-0 ${classes}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label ?? defaultLabel}
      </span>
    </div>
  );
}
