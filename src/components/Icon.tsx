/**
 * アイコンコンポーネント
 * 爆弾はゲーム専用のピクセルPNG、その他は絵文字を使用する。
 */

import Image from "next/image";

type IconName =
  | "flag"
  | "bomb"
  | "bomb-red"
  | "bomb-blue"
  | "clock"
  | "trophy"
  | "infinity"
  | "pause"
  | "play"
  | "heart"
  | "skull"
  | "star"
  | "home"
  | "back"
  | "check"
  | "x"
  | "ad"
  | "menu";

interface IconProps {
  name: IconName;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const IMAGE_MAP: Partial<Record<IconName, string>> = {
  "bomb-red": "/assets/frostbound/bombs-v1/bomb-red.png",
  "bomb-blue": "/assets/frostbound/bombs-v1/bomb-blue.png",
};

const EMOJI_MAP: Partial<Record<IconName, string>> = {
  flag: "🚩",
  bomb: "💣",
  clock: "⏱️",
  trophy: "🏆",
  infinity: "♾️",
  pause: "⏸️",
  play: "▶️",
  heart: "❤️",
  skull: "💀",
  star: "⭐",
  home: "🏠",
  back: "◀️",
  check: "✓",
  x: "✕",
  ad: "📺",
  menu: "☰",
};

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

const IMAGE_SIZE_PX = {
  sm: 16,
  md: 24,
  lg: 36,
  xl: 36,
};

export function Icon({ name, className = "", size = "md" }: IconProps) {
  const imageSrc = IMAGE_MAP[name];

  if (imageSrc) {
    const pixelSize = IMAGE_SIZE_PX[size];

    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        role="img"
        aria-label={name}
      >
        <Image
          src={imageSrc}
          alt=""
          width={36}
          height={36}
          style={{ width: pixelSize, height: pixelSize, imageRendering: "pixelated" }}
          draggable={false}
          unoptimized
        />
      </span>
    );
  }

  const emoji = EMOJI_MAP[name] ?? "";
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClass} ${className}`}
      role="img"
      aria-label={name}
    >
      {emoji}
    </span>
  );
}
