export type LetterboxVariant = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stageClass: "stageNavy" | "stageBlack" | "stageBleed" | "stageFramed";
  bleed?: boolean;
  framed?: boolean;
};

export const LETTERBOX_VARIANTS: LetterboxVariant[] = [
  {
    id: "navy",
    name: "紺べた",
    tagline: "SOLID NAVY",
    description:
      "余白をパネルと同じ濃紺(--navy-950)で塗るだけ。世界観の色から浮かない、いちばん手数の少ない案。",
    stageClass: "stageNavy",
  },
  {
    id: "black",
    name: "黒べた",
    tagline: "SOLID BLACK",
    description:
      "エミュレータ的な純黒の余白。キャンバスの輪郭がいちばんくっきり見えるが、氷の世界観からは浮く。",
    stageClass: "stageBlack",
  },
  {
    id: "bleed",
    name: "背景の続きを覗かせる",
    tagline: "BLURRED WORLD BLEED",
    description:
      "同じ背景ワールドをキャンバスの外側にも大きく・ぼかして・暗く敷く。画面の外にも世界が続いている感じを出す案。",
    stageClass: "stageBleed",
    bleed: true,
  },
  {
    id: "framed",
    name: "ビネット枠",
    tagline: "FRAMED BEZEL",
    description:
      "紺べたに、パネルと同じ角落としの縁取りをキャンバス自体に足す。画面という物体感を強める案。",
    stageClass: "stageFramed",
    framed: true,
  },
];
