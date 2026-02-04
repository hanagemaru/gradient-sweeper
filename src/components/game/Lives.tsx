"use client";

import { Icon } from "@/components/Icon";

interface LivesProps {
  lives: number;
  maxLives?: number;
}

export function Lives({ lives, maxLives = 3 }: LivesProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxLives }).map((_, i) => (
        <Icon
          key={i}
          name="heart"
          size="lg"
          className={i < lives ? "opacity-100" : "opacity-30"}
        />
      ))}
    </div>
  );
}
