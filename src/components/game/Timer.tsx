"use client";

import { Icon } from "@/components/Icon";
import { formatTime } from "@/hooks/useTimer";

interface TimerProps {
  elapsedMs: number;
}

export function Timer({ elapsedMs }: TimerProps) {
  return (
    <div className="flex items-center gap-2 text-xl font-mono">
      <Icon name="clock" />
      <span>{formatTime(elapsedMs)}</span>
    </div>
  );
}
