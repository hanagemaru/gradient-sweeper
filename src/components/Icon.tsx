/**
 * アイコンコンポーネント
 * MVPでは絵文字を使用し、将来的にSVG/PNGに置き換え可能
 */

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

// 絵文字マッピング（将来的にSVGに置換）
const EMOJI_MAP: Record<IconName, string> = {
  flag: "🚩",
  bomb: "💣",
  "bomb-red": "🔴",
  "bomb-blue": "🔵",
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

export function Icon({ name, className = "", size = "md" }: IconProps) {
  const emoji = EMOJI_MAP[name];
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
