import type { PixelUiStyles } from "./MockScreens";
import directionA from "./directionA.module.css";
import directionB from "./directionB.module.css";
import directionC from "./directionC.module.css";

export interface Direction {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  strengths: string[];
  risks: string[];
  styles: PixelUiStyles;
}

export const DIRECTIONS: Direction[] = [
  {
    id: "a",
    name: "案A",
    tagline: "GLACIER HUD",
    summary:
      "ゲーム画面のHUDをそのまま外に持ち出す。氷原の下地に濃紺パネルという game.module.css の構成を、ホームからランキングまで反復させる。",
    strengths: [
      "ゲーム画面との段差がほぼ無い。世界観の分断はこれで確実に消える",
      "既存の枠線・影の値をそのまま流用でき、実装が最短",
      "パネルの作りが一種類なので、共通コンポーネント化が素直",
    ],
    risks: [
      "情報の少ない画面では濃紺の面積が重く、ホームが設定画面のように見えやすい",
      "3案の中で最も無難。既存の延長で、新しさは出ない",
    ],
    styles: directionA,
  },
  {
    id: "b",
    name: "案B",
    tagline: "ICE FIELD",
    summary:
      "濃紺と氷色の主従を入れ替える。面を張るのは氷色の板で、濃紺は枠線と文字にだけ残す。ボタンは盤面の「開いた氷タイル」の見立てで、赤と青をそのまま持ち込む。",
    strengths: [
      "明るく圧迫感がない。スマホの小さい画面でも息が詰まらない",
      "メニューのボタンが盤面のタイルと同じ語彙になり、ゲームとの繋がりが意味の面でも出る",
      "屋外や明るい場所での視認性が3案で最も高い",
    ],
    risks: [
      "ゲーム画面の濃紺HUDに入った瞬間の明度差が大きい",
      "白と淡い氷色が主体になるぶん、ピクセルらしい重さは弱まる",
    ],
    styles: directionB,
  },
  {
    id: "c",
    name: "案C",
    tagline: "ARCADE CABINET",
    summary:
      "ゲーム画面を「筐体にはまったブラウン管」と見立て、その外側を作る。面は濃紺で塗りつぶし、氷色はネオンのアクセントとしてだけ使う。走査線とグローで筐体まわりの空気を作る。",
    strengths: [
      "世界観の主張が3案で最も強く、タイトル画面としての格が出る",
      "明るい盤面が「画面」として引き立つ。メニューとゲームの役割が構造として分かれる",
      "暗い面が広いので、将来バナー広告を置いても画面が散らからない",
    ],
    risks: [
      "氷というより筐体寄りで、グレイシャーテーマの軸から少し離れる",
      "ゲーム画面との明度差は案Bより大きい。遷移のたびに明暗が反転する",
    ],
    styles: directionC,
  },
];
