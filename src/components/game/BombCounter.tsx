"use client";

import { Icon } from "@/components/Icon";

interface BombCounterProps {
  remaining: number;
}

export function BombCounter({ remaining }: BombCounterProps) {
  return (
    <div className="flex items-center gap-2 text-xl font-mono">
      <Icon name="bomb-red" />
      <span className={remaining < 0 ? "text-red-400" : ""}>{remaining}</span>
    </div>
  );
}
