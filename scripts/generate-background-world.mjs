/**
 * 背景ワールドの固定配置を1回だけ計算し、`src/lib/background-world.ts` へ書き出す。
 *
 * ランタイムは乱数を一切持たない。ここで決めた座標をコミット済みの固定リストとして読むだけ。
 * シード付き乱数は「自然な散らばり方を一度だけ決める」ためにのみ使う。
 *
 * 配置の考え方（規則的なグリッド感を避けるため）:
 *   - 島（クラスター）単位で組む。大型形状を核にして、中小セルを不規則な角度・距離で従える。
 *   - 行や列にベースラインを揃えない。座標はギャップの倍数に乗せない。
 *   - 島と島の間に広い雪原の余白を残す。等間隔にしない。
 *   - ワールド端をまたぐ配置を許可し、矩形の「額縁」感を消す。
 *   - セル同士・セルとクリスタルは重ねない（棄却サンプリングで最小離隔を確保）。
 *
 * 確認用画像（全景と各画面比率の切り取り）は REVIEW_DIR へ出力する。リポジトリには含めない。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v2";
const PUBLIC_DIR = "public";
const REVIEW_DIR =
  process.env.REVIEW_DIR ?? "/tmp/gradient-sweeper-background-review";

/**
 * 固定キャンバス方式（390x670を1枚だけ描く）。これが現在の本番の方式。
 *
 * ワールド=キャンバスなのでタイリングも複数ビューポート対応も不要になり、
 * UI_KEEPOUT・CRYSTAL_SLOTS も単一の実測値だけで足りる。
 *
 * `CANVAS_MODE=0` で旧方式（2880x1620 のワールドをビューポートで覗くカメラ）に
 * 戻せる。既定を固定キャンバスにしてあるのは、素で再実行したときに本番の
 * `src/lib/background-world.ts` が旧方式で上書きされるのを防ぐため。
 */
const CANVAS_MODE = process.env.CANVAS_MODE !== "0";

// デスクトップまでカメラで覆えるサイズ。1920x1080 / 2560x1440 いずれも内側に収まる。
const WORLD_WIDTH = CANVAS_MODE ? 390 : 2880;
/*
 * キャンバス高さ。`src/components/ui/pixel-ui.module.css` の `.scene { height }` と
 * 必ず一致させること（ここがワールドの寸法、あちらが表示枠）。
 *
 * 当初は 844（iPhone 12〜14 の画面スペック）だったが、ブラウザは上下のUIで
 * 100〜190 CSS px 持っていくため実機に 844 の高さは存在せず、常に高さ基準で
 * 縮小されて左右に黒帯が出ていた。実機の svh 比（iOS Safari が 1.70〜1.75 に密集）
 * に合わせて 390 * 1.72 ≒ 670 に詰めた。根拠の詳細は pixel-ui.module.css の
 * 冒頭コメントと docs/tasks/I-canvas-fit.md にある。
 */
const WORLD_HEIGHT = CANVAS_MODE ? 670 : 1620;

/**
 * 横方向のタイリング回数。1 なら繰り返しなしの一点物。
 *
 * 配置は1タイル分（TILE_WIDTH x WORLD_HEIGHT）の座標系だけで行い、
 * x をトーラス（円環）として扱う。こうするとタイル右端をまたぐモチーフが
 * 左端に回り込み、繰り返しても継ぎ目が出ない。
 */
const TILE_REPEATS = CANVAS_MODE ? 1 : Number(process.env.TILE_REPEATS ?? 2);
const TILE_WIDTH = Math.round(WORLD_WIDTH / TILE_REPEATS);

/**
 * 同じアセットが近くに2つ並ぶと、そこだけ人工的に見えてしまう。
 * スマホ幅（375〜430）より大きい距離を空けることで、
 * 同じ絵が1画面に2つ入ることをほぼ無くす。
 */
// CANVAS_MODE はキャンバス幅(390)自体がスマホ幅なので、470のままだと
// キャンバス全域でほぼ同じ絵を2つ置けなくなり、逆にスカスカになる。縮める。
const SAME_ASSET_MIN_DISTANCE = CANVAS_MODE ? 160 : 470;

/**
 * モチーフ同士の最小すきま。
 *
 * 実測（1つ前の生成結果）でいちばん近い組は 5px しか空いておらず、
 * そこだけ2つの絵がくっついて1つの塊に見えていた。その3倍を新しい下限にする。
 * すきまは矩形間の分離距離 max(dx, dy) で測る（`fits` の margin と同じ定義）。
 */
const MIN_GAP = 15;

/**
 * UIパネルのキープアウト（クリスタル専用）。
 *
 * カメラはワールド中央固定なので、ビューポート (vw, vh) が映すのは
 * x = 1440 ± vw/2、y = 810 ± vh/2。ここに `.stack`（パネル＋言語トグル）が
 * 重なる範囲を、スマホ5サイズ（360/375/390/414/430）× 本番4ページで
 * 実測して和を取った値が `x[1241,1639] y[476,1090]`。
 *
 *   home/ta   .stackMenu = 320px  → x[1280,1600]
 *   result    .stack     = 350px  → x[1265,1615]（最も下まで伸びる）
 *   ranking   .stackWide = 440px  → x[1241,1639]（最も広い）
 *
 * これにパネルの落ち影（6px 12px）ぶんの余裕を足す。
 * セル系モチーフはパネルに重なってよいので、この判定はクリスタルにだけ効かせる。
 *
 * 注意: x の幅（414px）は最小スマホの幅 375px より広い。つまり最小画面では
 * パネルの左右に逃げ場が無く、クリスタルは上下の帯にしか置けない。
 */
/**
 * CANVAS_MODE のキープアウト。
 *
 * 固定キャンバス(390x670)では画面サイズが1つしかないので、実測も1回で済む。
 * ただし**ページごとにパネルの高さが違う**。倍率1（ビューポート 390x670）で
 * 実測した `.stack`（パネル＋言語トグル）の下端は:
 *
 *   home     [120,488]   （パネル 120-423 + 言語トグル 437-488）
 *   ranking  [120,511]
 *   ta       [120,514]
 *   result   [120,626]   ← 最も高い
 *
 * y1 は result を除く最大（ta の 514）に、落ち影と余裕の 10px を足した 524。
 * result だけ別扱いにしているのは、`CANVAS_BOTTOM_BANDS` のコメントにある
 * 「完全に見える or 完全にパネルの裏」を成立させるため（下側の帯は
 * result のパネルの裏に完全に収まるように取ってある）。
 *
 * y0=120 は `pixel-ui.module.css` の `.content { padding-top: 120px }` と直結。
 * レイアウトを変えたらここも実測を取り直すこと。
 */
const CANVAS_UI_KEEPOUT = { x0: 25, x1: 365, y0: 110, y1: 524 };

const UI_KEEPOUT = CANVAS_MODE ? CANVAS_UI_KEEPOUT : { x0: 1233, x1: 1647, y0: 468, y1: 1096 };

/**
 * パネルの上下に必ずクリスタルを1つずつ見せるための予約枠。
 *
 * パネルの上端はビューポート高さに依存する（`.content` の
 * `padding-top: clamp(92px, 15vh, 132px)`）ため、ワールド座標では画面が
 * 大きいほど上へ動く。実測値:
 *
 *   viewport   可視 y          パネル上端   パネル下端
 *   360x640    [ 490,1130]      586         1090
 *   375x667    [ 477,1144]      577         1082
 *   390x844    [ 388,1232]      515         1021
 *   414x896    [ 362,1258]      494         1002
 *   430x932    [ 344,1276]      476          986
 *
 * 「可視かつパネルより上」の帯は 5サイズで共通部分が無い（490 > 476）。
 * つまり全機種で1つのクリスタルを上に見せることは原理的にできない。
 * そこで上側は2枠に分け、どの機種でも「完全に見える」か「完全にパネルの
 * 裏へ隠れる／画面外」のどちらかになるようにする。中途半端に半分だけ
 * パネルへ潜り込む見え方（今回の指摘）が起きないのが条件。
 *
 *   above-near: 小型機（360/375）で見える。390 以上では不透明部分がパネル上端より
 *               下に入るので完全にパネルの裏（＝見えないだけで、破綻はしない）。
 *   above-far : 大型機（390/414/430）で見える。375 以下では可視域より上で画面外。
 *   below     : 全機種でパネルより下、かつ画面内に収まる。
 *
 * y の範囲は不透明部分（oy/oh）を基準に決めてある。PNG の透明な余白は
 * パネルに掛かってよいので、矩形の y はその余白ぶん上にずれている。
 *
 * 3枠は種類を重複させない。同時に見えるのは (above-near, below) か
 * (above-far, below) のどちらかなので、これで1画面に同じクリスタルは並ばない。
 */
/**
 * CANVAS_MODE の予約枠。
 *
 * 画面サイズが1つしかないので、機種ごとに帯を分ける必要がない
 * （＝固定キャンバス化の狙いそのもの）。使うクリスタルを1つずつ、
 * 全部この枠で確保する。島と fillGaps はクリスタルを置かない（下記
 * `CANVAS_MODE` の分岐）ので、画面に映るクリスタルはここの枠だけになる。
 *
 * cluster-large はデザイン判断で不採用。枠を持たない＝どこにも出てこない。
 *
 * 帯は2つ:
 *   上 y[4,102]   … キープアウト上端 110 の上。98px しかないので小型のみ。
 *   下 y[524,626] … キープアウト下端 524 の下、result のパネル下端 626 の上。102px。
 *
 * 上の帯はキープアウト上端（110）基準なのでキャンバス高さを変えても動かない。
 * 下の帯はページごとのパネル下端に挟まれた「クリーンゾーン」なので、
 * キャンバス高さや `.content` の padding を変えたら必ず実測を取り直すこと。
 * 844 のときの下帯は y[504,840] の 336px で、両方のクリスタルを段に分ける
 * 余裕があった。670 では 102px しかない（下記 CANVAS_BOTTOM_BANDS 参照）。
 *
 * パネルの上に置くのは一番小さい accent-small だけ（指定）。
 * 残り2つは下の帯へ回す。
 *
 * y は PNG の矩形ではなく不透明部分（oy/oh）が帯に収まるように決めてある。
 *   accent-small   40x40  不透明 (3,7)  34x33 → 不透明 y = Y+7 .. Y+40
 *   cluster-medium 110x90 不透明 (9,6)  92x84 → 不透明 y = Y+6 .. Y+90
 *   cluster-wide  120x80  不透明 (3,35) 114x45 → 不透明 y = Y+35 .. Y+80
 */
const CANVAS_CRYSTAL_SLOTS = [
  // 上の帯。不透明 y = Y+7..Y+40 を [4,102] に収める → Y in [-3,62]。
  { key: "above-small", name: "accent-small", x0: 10, x1: 380, y0: 8, y1: 60, behindPanel: false },
  // 下の帯。y0/y1 は resolveCanvasBottomBands が段ごとに埋める。
  { key: "bottom-medium", name: "cluster-medium", x0: 10, x1: 380, behindPanel: false },
  { key: "bottom-wide", name: "cluster-wide", x0: 10, x1: 380, behindPanel: false },
];

/**
 * 下の帯に入る2つのクリスタルの Y。
 *
 * 満たすべき条件が2つある。
 *
 * 1. **どのページでも「完全に見える」か「完全にパネルの裏」のどちらかになる。**
 *    中途半端に半分だけパネルへ潜り込む見え方は不可（既出の指摘）。
 *    パネル下端はページごとに 488 / 511 / 514 / 626（CANVAS_UI_KEEPOUT の
 *    コメント参照）なので、不透明部分を **y[524,626] に収める**と
 *    home/ranking/ta では全部見え、result では全部パネルの裏に入る。
 *    帯の上端 524 はキープアウト下端、下端 626 は result のパネル下端。
 *
 * 2. **2つを同じ高さに置くと横一列に並んで見えて不自然**（既出の指摘）。
 *    帯が 336px あった 844 のときは上下2段に割って 44px の空白を強制できたが、
 *    670 では帯が 102px しかなく、不透明部分の合計 129px（84 + 45）すら入らない。
 *    段に割るのはやめ、**不透明部分の中心をできるだけずらす**ことで代替する。
 *    横方向は帯幅 370px を使って `fits()` の MIN_GAP が離してくれるので、
 *    「中心がずれた2つが横に離れて置かれる」絵になる。
 *
 * 値は矩形の Y。不透明部分が帯に収まるよう oy を引いてある。
 *   cluster-medium 不透明 y = Y+6 .. Y+90（84px）→ 中心 Y+48
 *   cluster-wide   不透明 y = Y+35 .. Y+80（45px）→ 中心 Y+57.5
 *
 * 帯 y[524,626] に収める制約から、取りうる中心の範囲は
 *   medium 中心 ∈ [566, 584]   (Y ∈ [518, 536])
 *   wide   中心 ∈ [546.5, 603.5] (Y ∈ [489, 546])
 * となり、**中心のずれは原理的に 37.5px が上限**。セル同士に課している
 * ROW_MIN_OFFSET(40) はこの帯では達成できないので、この2つだけは
 * 上限いっぱいまで離すことで代える（`notRowAligned` は CANVAS_MODE の
 * クリスタルには掛からない。予約枠でしか置かれないため）。
 * シルエットも 84px の縦長と 45px の平たい塊で大きく違うので、
 * 中心が 33px 離れていれば横一線には見えない。
 *
 *   medium が上: medium Y in [518,520] → 中心 [566,568]
 *               wide   Y in [543,546] → 中心 [600.5,603.5]  ずれ >= 32.5
 *   wide が上:   wide   Y in [489,492] → 中心 [546.5,549.5]
 *               medium Y in [534,536] → 中心 [582,584]      ずれ >= 32.5
 */
const CANVAS_BOTTOM_BANDS = {
  "cluster-medium": { upper: [518, 520], lower: [534, 536] },
  "cluster-wide": { upper: [489, 492], lower: [543, 546] },
};

/**
 * どちらを上に置くかはシードごとに入れ替える（2案で同じ絵にならないように）。
 *
 * `upper` / `lower` は「帯の中で上に来るのはどちらか」で選ぶ枠であって、
 * 段そのものではない（上記のとおり段には割れない）。medium が上のときは
 * medium が `upper`、wide が `lower` の枠を使う。
 */
function resolveCanvasBottomBands(slots) {
  const mediumOnTop = rand() < 0.5;
  return slots.map((slot) => {
    const bands = CANVAS_BOTTOM_BANDS[slot.name];
    if (!bands) return slot;
    const useUpper = slot.name === "cluster-medium" ? mediumOnTop : !mediumOnTop;
    const [y0, y1] = useUpper ? bands.upper : bands.lower;
    return { ...slot, y0, y1 };
  });
}

const CRYSTAL_SLOTS = CANVAS_MODE
  ? CANVAS_CRYSTAL_SLOTS
  : [
      // cluster-wide: 120x80、不透明部分は (3,35) から 114x45。
      // 不透明部分が y[517,572] に入る → 375 ではパネル上端 577 の上、390 以上では裏。
      { key: "above-near", name: "cluster-wide", x0: 1281, x1: 1599, y0: 482, y1: 492, behindPanel: true },
      // cluster-medium: 110x90、不透明部分は (9,6) から 92x84。
      // 不透明部分の下端をキープアウト上端 468 以内に収め、390 の可視上端 388 に寄せる。
      { key: "above-far", name: "cluster-medium", x0: 1250, x1: 1630, y0: 374, y1: 378, behindPanel: false },
      // accent-small: 40x40、不透明部分は (3,7) から 34x33。
      // パネル下端の下（1096〜）と 375 の可視下端 1144 の間に完全に収まる唯一のサイズ。
      { key: "below", name: "accent-small", x0: 1250, x1: 1630, y0: 1089, y1: 1092, behindPanel: false },
    ];

/** 確認画像のファイル名につける識別子（試作の比較用） */
const SUFFIX = TILE_REPEATS > 1 ? `-x${TILE_REPEATS}` : "-x1";

/** 島の核になる大型形状 */
const ALL_CORE_SHAPES = [
  "headland", "terrace", "ridge-wide", "bluff-tall",
  "mega-l", "mega-step", "mega-wide", "mega-tall",
];

/**
 * CANVAS_MODE 用の核形状。
 *
 * 元の CORE_SHAPES は幅320〜576pxあり、キャンバス幅390pxの中では
 * 「核」というより画面のほぼ全部を占める1枚絵になってしまい、ほぼ置けずに
 * 棄却され続ける（実測: 320px幅の mega-wide 単体でも成功率2/50）。
 * SATELLITE_SHAPES（最大192px、キャンバス幅の半分程度）を核としても使う。
 */
const CANVAS_CORE_SHAPES = ["square", "wide", "tall", "l", "l-rotated", "step"];

const CORE_SHAPES = CANVAS_MODE ? CANVAS_CORE_SHAPES : ALL_CORE_SHAPES;

/** 核の周りに従える中小形状 */
const SATELLITE_SHAPES = ["square", "wide", "tall", "l", "l-rotated", "step"];

/**
 * クリスタル。同じ絵が近くに並ぶと一気に人工的に見えるので、
 * 1つの島の中では種類を重複させず、小さなアクセントも出しすぎない。
 */
const CRYSTAL_WEIGHTS = [
  { name: "cluster-large", weight: 26 },
  { name: "cluster-medium", weight: 28 },
  { name: "cluster-wide", weight: 26 },
  { name: "accent-small", weight: 20 },
];

/**
 * 素材の色。雪原が主役なので covered を厚くし、開封セルは差し色にとどめる。
 * 赤は「危険」の色なので最も希少にする。
 */
const ALL_PALETTE_WEIGHTS = [
  { prefix: "covered", weight: 62 },
  { prefix: "open-blue", weight: 20 },
  { prefix: "open-purple", weight: 12 },
  { prefix: "open-red", weight: 6 },
];

/**
 * CANVAS_MODE の色の決め方。
 *
 * 要件は「未開封(covered)が主役、赤ベースが見える位置に1つ、青ベースが1つ以上、
 * 紫は使わない」。重み付き抽選だけでは個数も可視性も保証できない
 * （赤が0個や2個になる、covered がパネル裏に隠れて実質0個に見える、等）ので、
 * 抽選では紫を引かず covered / open-blue だけにしたうえで、covered と赤は
 * `reserveVisibleCell` で見える位置へ先に1個ずつ確保する（下記）。
 * 紫を抜いたぶんの重みは青に足す。
 */
const CANVAS_PALETTE_WEIGHTS = [
  { prefix: "covered", weight: 62 },
  { prefix: "open-blue", weight: 38 },
];

const PALETTE_WEIGHTS = CANVAS_MODE ? CANVAS_PALETTE_WEIGHTS : ALL_PALETTE_WEIGHTS;

/** mulberry32: シード固定の疑似乱数 */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 既定シードは、本番で採用した配置を再現する値。
 * 素で再実行すればコミット済みの `src/lib/background-world.ts` と一致する。
 *
 * CANVAS_MODE の 5004 は、覗き・横並び・クリスタル欠けの制約を入れたあとに
 * 30シードを比較して選んだもの（可視セル4個で最も密度と散らばりが良い）。
 * 制約を変えると同じシードでも別の絵になるので、変更したら選び直すこと。
 */
const DEFAULT_SEED = CANVAS_MODE ? 5004 : 20260815;
const rand = mulberry32(Number(process.env.SEED ?? DEFAULT_SEED));
const between = (lo, hi) => lo + rand() * (hi - lo);
const pick = (list) => list[Math.floor(rand() * list.length)];

function pickWeighted(entries, key) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rand() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry[key];
  }
  return entries[0][key];
}

const pickPalette = () => pickWeighted(PALETTE_WEIGHTS, "prefix");

/**
 * PNG の寸法と、不透明ピクセルのバウンディングボックス。
 *
 * クリスタルの絵は PNG の下寄りに描かれていて、上側に透明の余白がある
 * （例: cluster-wide は 120x80 のうち上 35px が透明）。パネルとの重なりや
 * 画面内に見えているかを PNG の矩形で判定すると、透明部分まで「見えている」
 * ことになり、実際には何も映っていない位置を採用してしまう。
 * そのため、見え方に関わる判定はすべて不透明部分の矩形で行う。
 */
const sizeCache = new Map();
async function assetSize(base, name) {
  const key = `${base}/${name}`;
  if (sizeCache.has(key)) return sizeCache.get(key);
  const file = path.join(PUBLIC_DIR, base, `${name}.png`);
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] <= 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  const size = {
    w: info.width,
    h: info.height,
    ox: x0,
    oy: y0,
    ow: x1 - x0 + 1,
    oh: y1 - y0 + 1,
  };
  sizeCache.set(key, size);
  return size;
}

const placed = [];

/**
 * 配置済みのどれとも重ならないか。margin は呼び出しごとに変えて等間隔感を消す。
 *
 * x はトーラスなので、タイル1枚ぶん左右にずらした位置でも判定する。
 * これをやらないとタイルの右端と左端のモチーフが、繰り返したときに重なってしまう。
 */
function fits(rect, margin) {
  for (const other of placed) {
    const overlapsY =
      rect.y < other.y + other.h + margin && rect.y + rect.h + margin > other.y;
    if (!overlapsY) continue;

    for (const shift of [-TILE_WIDTH, 0, TILE_WIDTH]) {
      const ox = other.x + shift;
      if (rect.x < ox + other.w + margin && rect.x + rect.w + margin > ox) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 縦方向にワールドへ掛かっていれば採用。
 * x はトーラスなのでどの値でも有効（書き出し時に横へ複製される）。
 *
 * CANVAS_MODE では上下端は横端と違って「回り込む」先が無い、ただの
 * キャンバスの外なので、はみ出しは折り返しではなく素の切れ端になる
 * （指摘: 画面上端でクリスタル／セルが物理的に切れて見える）。
 * よって CANVAS_MODE だけは「掛かっている」ではなく「完全に収まっている」
 * を採用条件にする。
 */
function touchesWorld(rect) {
  if (CANVAS_MODE) return rect.y >= 0 && rect.y + rect.h <= WORLD_HEIGHT;
  return rect.y < WORLD_HEIGHT && rect.y + rect.h > 0;
}

/** 同じアセットが近くに無いか。x はトーラスなので左右にずらした位置も見る。 */
function farFromSameAsset(rect) {
  for (const other of placed) {
    if (other.name !== rect.name) continue;
    for (const shift of [-TILE_WIDTH, 0, TILE_WIDTH]) {
      const ox = other.x + shift;
      const dx = Math.max(ox - (rect.x + rect.w), rect.x - (ox + other.w), 0);
      const dy = Math.max(other.y - (rect.y + rect.h), rect.y - (other.y + other.h), 0);
      if (Math.hypot(dx, dy) < SAME_ASSET_MIN_DISTANCE) return false;
    }
  }
  return true;
}

/**
 * クリスタルがUIパネルに掛からないか。透明の余白は掛かってよいので不透明部分で見る。
 * 配置はタイル座標なので、ワールド座標のキープアウトを各タイル位置へ写して判定する。
 */
function clearOfUiPanel(rect) {
  const y0 = rect.y + rect.oy;
  const y1 = y0 + rect.oh;
  for (let k = -1; k <= TILE_REPEATS; k += 1) {
    const x0 = rect.x + rect.ox + k * TILE_WIDTH;
    if (
      x0 < UI_KEEPOUT.x1 &&
      x0 + rect.ow > UI_KEEPOUT.x0 &&
      y0 < UI_KEEPOUT.y1 &&
      y1 > UI_KEEPOUT.y0
    ) {
      return false;
    }
  }
  return true;
}

/**
 * メインメニュー（ホーム）の遮蔽物。倍率1のDOMから実測した値。
 *
 * `UI_KEEPOUT` はクリスタル用に「全ページの和 + 落ち影の余裕」を取った
 * 広めの矩形なので、セルの見え方を判定する用途には使えない。ホームでは
 * パネル本体は y423 で終わり、言語トグルとの間（423〜437）と、トグルの
 * 左右は背景が見えている。この差を無視して UI_KEEPOUT で「隠れている」と
 * 判定すると、実際には数pxだけ覗いているセルを通してしまう。
 *
 * 判定はホームに対してだけ行う（指定）。
 */
const HOME_OCCLUDERS = [
  { x0: 35, x1: 355, y0: 120, y1: 423 }, // .panel
  { x0: 134, x1: 256, y0: 437, y1: 488 }, // .languageToggle
];

const overlap1d = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/** ホームで実際に見えている不透明部分の面積（画面内、かつ遮蔽物の外）。 */
function homeVisibleArea(x0, y0, x1, y1) {
  const onScreen = overlap1d(x0, x1, 0, WORLD_WIDTH) * overlap1d(y0, y1, 0, WORLD_HEIGHT);
  let hidden = 0;
  for (const o of HOME_OCCLUDERS) {
    hidden += overlap1d(x0, x1, o.x0, o.x1) * overlap1d(y0, y1, o.y0, o.y1);
  }
  return Math.max(0, onScreen - hidden);
}

/**
 * 見えている領域に収まる最大の矩形の「短辺」を返す。
 *
 * 見えている領域 = 不透明部分 ∩ 画面 − 遮蔽物。遮蔽物が2つあるので
 * この領域はL字やコの字になり、単純な帯の計算では測れない。実際、
 * 言語トグルを無視して「パネルの下に66pxの帯がある」と判定した配置が、
 * トグルに分断されて 14px・38px・23px の細切れになっていた（実測）。
 *
 * 遮蔽物の辺でグリッドに切り、遮蔽されていないセルだけから成る矩形を
 * 全通り試して最大の短辺を求める。グリッドはたかだか 4x4 程度なので
 * 総当たりで足りる。
 */
function largestVisibleSide(x0, y0, x1, y1) {
  const vx0 = Math.max(x0, 0);
  const vx1 = Math.min(x1, WORLD_WIDTH);
  const vy0 = Math.max(y0, 0);
  const vy1 = Math.min(y1, WORLD_HEIGHT);
  if (vx1 <= vx0 || vy1 <= vy0) return 0;

  const xs = new Set([vx0, vx1]);
  const ys = new Set([vy0, vy1]);
  for (const o of HOME_OCCLUDERS) {
    for (const v of [o.x0, o.x1]) if (v > vx0 && v < vx1) xs.add(v);
    for (const v of [o.y0, o.y1]) if (v > vy0 && v < vy1) ys.add(v);
  }
  const xa = [...xs].sort((a, b) => a - b);
  const ya = [...ys].sort((a, b) => a - b);

  const free = [];
  for (let r = 0; r + 1 < ya.length; r += 1) {
    const row = [];
    for (let c = 0; c + 1 < xa.length; c += 1) {
      const mx = (xa[c] + xa[c + 1]) / 2;
      const my = (ya[r] + ya[r + 1]) / 2;
      const hidden = HOME_OCCLUDERS.some(
        (o) => mx > o.x0 && mx < o.x1 && my > o.y0 && my < o.y1,
      );
      row.push(hidden ? 0 : 1);
    }
    free.push(row);
  }

  let best = 0;
  for (let r0 = 0; r0 < free.length; r0 += 1) {
    for (let r1 = r0; r1 < free.length; r1 += 1) {
      const h = ya[r1 + 1] - ya[r0];
      let runWidth = 0;
      for (let c = 0; c < free[0].length; c += 1) {
        let openColumn = true;
        for (let r = r0; r <= r1; r += 1) if (!free[r][c]) openColumn = false;
        if (!openColumn) {
          runWidth = 0;
          continue;
        }
        runWidth += xa[c + 1] - xa[c];
        best = Math.max(best, Math.min(runWidth, h));
      }
    }
  }
  return best;
}

/**
 * セルがメニューパネルの縁から「ほんの少しだけ」覗いていないか。
 *
 * セルはパネルに重なってよい規則（クリスタルと違い clearOfUiPanel は適用しない）
 * だが、重なりが浅いと縁から細い帯だけが覗き、ノイズにしか見えない（指摘）。
 *
 * 面積比で判定すると、大きい形状ほど同じ「細さ」でも比率が上がって判定が
 * ぶれる。見たいのは細さそのものなので、見えている領域に収まる最大の矩形の
 * 短辺が、読める大きさ（MIN_ONSCREEN）に届いていることを要求する。
 *
 *   - 完全に隠れている（可視面積0）→ OK（見えないので破綻しない）
 *   - それ以外 → 見えている塊が MIN_ONSCREEN 角の正方形を含むこと
 */
/**
 * 見え方の判定に使う「実際に画面へ出る位置」の不透明矩形。
 *
 * `settleToward` は x をタイル座標のまま探索し、採用が決まってから
 * [0, TILE_WIDTH) へ正規化する。正規化前の x で見え方を判定すると、
 * 判定時は画面外だったものが正規化で画面内へ移動し、覗きになって
 * すり抜ける（実測: x=-373 で「完全に隠れている」と判定 → 正規化後 x=17 で
 * パネル左に 14px の細い覗きになっていた）。
 *
 * 正規化したうえで、トーラスの複製のうち最も画面に出るものを返す。
 * `dropSliverCopies` が残すのも可視面積が最大の複製なので、判定と実際に
 * 描かれるものが一致する。
 */
function screenRectOf(rect) {
  const nx = ((rect.x % TILE_WIDTH) + TILE_WIDTH) % TILE_WIDTH;
  const y0 = rect.y + rect.oy;
  const y1 = y0 + rect.oh;
  let best = null;
  let bestArea = -1;
  for (const shift of [-TILE_WIDTH, 0, TILE_WIDTH]) {
    const x0 = nx + rect.ox + shift;
    const x1 = x0 + rect.ow;
    const area = overlap1d(x0, x1, 0, WORLD_WIDTH) * overlap1d(y0, y1, 0, WORLD_HEIGHT);
    if (area > bestArea) {
      bestArea = area;
      best = { x0, y0, x1, y1 };
    }
  }
  return best;
}

function noPanelSliver(rect) {
  const { x0, y0, x1, y1 } = screenRectOf(rect);
  if (homeVisibleArea(x0, y0, x1, y1) <= 0) return true;
  return largestVisibleSide(x0, y0, x1, y1) >= MIN_ONSCREEN;
}

/**
 * 別のモチーフと「横一列」に並んでいないか（指摘: 要素が真横に並ぶ）。
 *
 * ホームのパネルは幅320・高さ303あり、キャンバス390x670の中央を占める。
 * つまりセルが読める大きさで見えるのは上下の帯だけで、放っておくと
 * 同じ帯に入った2〜3個が同じ高さに揃い、画面を横切る一本の線に見える。
 *
 * 見えているモチーフ同士だけを対象に、横に離れている（重なっていない）なら
 * 不透明部分の中心Yを ROW_MIN_OFFSET 以上ずらすことを要求する。
 * 隠れているものは線を作らないので対象外。x が重なっている縦の並びは
 * 「積み上がった島」に見えるので、これも対象外。
 */
const ROW_MIN_OFFSET = 40;

function notRowAligned(rect) {
  const me = screenRectOf(rect);
  if (homeVisibleArea(me.x0, me.y0, me.x1, me.y1) <= 0) return true;
  const cy = (me.y0 + me.y1) / 2;

  for (const other of placed) {
    const it = screenRectOf(other);
    if (homeVisibleArea(it.x0, it.y0, it.x1, it.y1) <= 0) continue;

    const ocy = (it.y0 + it.y1) / 2;
    if (Math.abs(cy - ocy) >= ROW_MIN_OFFSET) continue;
    // x が重なっていれば縦に積まれた見え方なので許容する。
    if (overlap1d(me.x0, me.x1, it.x0, it.x1) > 0) continue;
    return false;
  }
  return true;
}

/**
 * 画面にほんの少しだけ入っているセルはノイズに見える、という指摘への対応。
 *
 * 「モチーフとして読める最小の大きさ」をゲームの1セル分（36px）とする。
 * 実測（前回の3シード）では、意味のあるモチーフの可視幅・可視高さは 53px 以上、
 * ノイズに見えたものは 28px 以下と、この境界できれいに分かれていた。
 *
 * 端で切れていないものは、小さくてもノイズではないので対象外
 * （クリスタルの accent-small は不透明部分が 34x33 しかない）。
 */
const MIN_ONSCREEN = 36;

/** 画面に写る不透明部分の幅と高さ。x はトーラスなので複製位置ごとに測る。 */
function onScreenExtent(rect, shift) {
  const x0 = rect.x + rect.ox + shift;
  const y0 = rect.y + rect.oy;
  return {
    vw: Math.max(0, Math.min(x0 + rect.ow, WORLD_WIDTH) - Math.max(x0, 0)),
    vh: Math.max(0, Math.min(y0 + rect.oh, WORLD_HEIGHT) - Math.max(y0, 0)),
  };
}

/** その複製が「読める」か。端で切れていない、または切れても36px以上残っている。 */
function isReadableCopy(rect, shift) {
  const { vw, vh } = onScreenExtent(rect, shift);
  if (vw === rect.ow && vh === rect.oh) return true;
  return vw >= MIN_ONSCREEN && vh >= MIN_ONSCREEN;
}

/** 複製のうち1枚でも読める大きさで画面に入っているか（配置を採用してよいか）。 */
function hasReadableCopy(rect) {
  for (let k = -2; k <= 2; k += 1) {
    if (onScreenExtent(rect, k * TILE_WIDTH).vw > 0 && isReadableCopy(rect, k * TILE_WIDTH)) {
      return true;
    }
  }
  return false;
}

/**
 * maxReach（島の種からどれだけ離れた位置まで探すか）は、もとの1440px幅タイル
 * を基準に決めた値。CANVAS_MODE のタイル幅は390pxしかない。
 *
 * `settleToward` は「いちばん遠い距離から fits を試し、最初に失敗したら即 break」
 * という探索なので、reach がトーラス周期(390)の半分に近い・それを超えると
 * 「遠い」はずの候補がラップして逆側の近くに戻ってしまい、実質どの角度でも
 * 遠端が何かに衝突 → 1回も内側を試せずに settled=null で終わる
 * （実測: reach=300のままだと核の設置成功率2〜4/50）。
 * 用途ごとに、周期の半分(195)より十分小さい固定値へ個別に差し替える。
 */
const reach = (n, canvasValue) => (CANVAS_MODE ? canvasValue : n);

/**
 * 島の中心へ向かって「落として」配置する。
 *
 * 外側から内側へ少しずつ寄せ、ぶつかる直前で止める。こうすると新しいセルが
 * 既にある島に寄り添って積み上がり、密集した群島と広い雪原が自然に分かれる。
 * 中心からの距離を乱数で決める方式だと、どの島も同じ密度に均されてしまう。
 */
function settleToward(base, name, size, cx, cy, attempts, maxReach, gapLo, gapHi) {
  // すきまの下限を MIN_GAP まで引き上げる。幅（gapHi - gapLo）はそのまま保つので、
  // 「どの組も最低 MIN_GAP は空く」だけで、間隔のばらつきは失われない。
  const spread = gapHi - gapLo;
  const lo = Math.max(gapLo, MIN_GAP);

  for (let i = 0; i < attempts; i += 1) {
    const angle = rand() * Math.PI * 2;
    const gap = Math.round(between(lo, lo + spread));
    const jitterX = between(-10, 10);
    const jitterY = between(-10, 10);

    const rectAt = (distance) => ({
      ...size,
      base,
      name,
      x: Math.round(cx + Math.cos(angle) * distance - size.w / 2 + jitterX),
      y: Math.round(cy + Math.sin(angle) * distance - size.h / 2 + jitterY),
    });

    const isCrystal = base === CRYSTAL_BASE;

    let settled = null;
    for (let distance = maxReach; distance >= 0; distance -= 6) {
      const rect = rectAt(distance);
      if (!fits(rect, gap)) break;
      // 制約を満たさない位置は「そこで止まる」のではなく素通りさせる。
      // 内側にもっと良い位置があるかもしれないので、探索は続ける。
      if (!farFromSameAsset(rect)) continue;
      if (isCrystal && !clearOfUiPanel(rect)) continue;
      // セルはパネルに重なってよいが、縁からわずかに覗くだけの状態は避ける
      // （noPanelSliver のコメント参照）。
      if (CANVAS_MODE && !isCrystal && !noPanelSliver(rect)) continue;
      if (CANVAS_MODE && !notRowAligned(rect)) continue;
      // 画面に破片しか映らない位置は最初から採らない。ここで弾いておけば
      // fillGaps が代わりの位置を探すので、密度を落とさずにノイズだけ減る。
      if (CANVAS_MODE && !hasReadableCopy(rect)) continue;
      settled = rect;
    }

    if (settled && touchesWorld(settled)) {
      // x をタイル内へ正規化し、配置リストを正準形にしておく
      settled.x = ((settled.x % TILE_WIDTH) + TILE_WIDTH) % TILE_WIDTH;
      placed.push(settled);
      return settled;
    }
  }
  return null;
}

/**
 * 島の種を層化ジッタで撒く。
 *
 * 完全な乱数だと大きな空白ができ、カメラが常に中央を映す以上、
 * スマホでその空白を引くと背景がほぼ無地になってしまう。
 * ワールドを区画に切って区画ごとに1つ、区画内のランダムな位置へ置くことで、
 * 位置は不規則なまま、どの画面サイズでも一定の密度を保証する。
 * 区画はスマホのビューポートより大きいので、格子には見えない。
 */
function seedIslands(strideX, strideY) {
  const seeds = [];
  // x はタイル内だけを走査する（トーラスなので端の外側は不要）。
  // 縦は繰り返さないので、上下は外側の区画も1列ぶん回して端をまたがせる。
  for (let gx = 0; gx * strideX < TILE_WIDTH; gx += 1) {
    for (let gy = -1; gy * strideY < WORLD_HEIGHT + strideY; gy += 1) {
      seeds.push({
        x: gx * strideX + between(0, strideX),
        y: gy * strideY + between(0, strideY),
      });
    }
  }
  // 生成順に並んだままだと、詰め込みの順序が左上から右下へ偏る。
  // 順序をシャッフルして、どの島が先に場所を取るかを不規則にする。
  for (let i = seeds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
  }
  return seeds;
}

/** 配置済みの矩形までの最短距離（x はトーラス）。空き具合の指標に使う。 */
function emptiness(px, py) {
  let nearest = Infinity;
  for (const r of placed) {
    let best = Infinity;
    for (const shift of [-TILE_WIDTH, 0, TILE_WIDTH]) {
      const rx = r.x + shift;
      const dx = Math.max(rx - px, 0, px - (rx + r.w));
      const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
      best = Math.min(best, Math.hypot(dx, dy));
    }
    nearest = Math.min(nearest, best);
  }
  return nearest;
}

/**
 * 空いている場所を探して埋める。
 *
 * 島を撒くだけだと、タイル幅が狭いほど回り込み判定で棄却されて密度が落ち、
 * カメラが常に映すワールド中央が広い空白になることがある。
 * 候補点をいくつか撒いて「最も空いている点」を選ぶことで、
 * 格子に頼らずに穴だけを埋められる。
 */
async function fillGaps(targetCount) {
  let guard = 0;
  while (placed.length < targetCount && guard < targetCount * 12) {
    guard += 1;

    // 候補をばらまき、いちばん空いている点を選ぶ
    let spot = null;
    let spotScore = -1;
    for (let i = 0; i < 40; i += 1) {
      const px = between(0, TILE_WIDTH);
      const py = between(40, WORLD_HEIGHT - 40);
      const score = emptiness(px, py);
      if (score > spotScore) { spotScore = score; spot = { x: px, y: py }; }
    }
    if (!spot) break;

    // 空きが大きいところには大きめの形状を置く
    const useCore = spotScore > 240 && rand() < 0.55;
    // クリスタルは単体で浮いていると不自然なので、セルのすぐ脇に寄せられる
    // ときだけ置く。数も全体の2割程度で打ち止めにする。
    // CANVAS_MODE では「採用した種類を1つずつだけ」が要件なので、予約枠
    // （CANVAS_CRYSTAL_SLOTS）で確保した3つ以外は一切置かない。
    const crystalCount = placed.filter((p) => p.base === CRYSTAL_BASE).length;
    const useCrystal =
      !CANVAS_MODE &&
      !useCore &&
      spotScore < 90 &&
      crystalCount < targetCount * 0.2 &&
      rand() < 0.25;

    if (useCrystal) {
      const name = pickWeighted(CRYSTAL_WEIGHTS, "name");
      const size = await assetSize(CRYSTAL_BASE, name);
      settleToward(CRYSTAL_BASE, name, size, spot.x, spot.y, 12, reach(120, 60), 4, 14);
    } else {
      const shape = useCore ? pick(CORE_SHAPES) : pick(SATELLITE_SHAPES);
      const name = `${pickPalette()}-${shape}`;
      const size = await assetSize(AUTOTILE_BASE, name);
      settleToward(AUTOTILE_BASE, name, size, spot.x, spot.y, 14, reach(200, 90), 8, 30);
    }
  }
}

/**
 * パネルの上下のクリスタルを先に確保する。
 *
 * どの枠も帯が数十pxしかないので、あとから空きを探しても取れない。
 * 島を撒く前に置いて場所を押さえる（以降のモチーフはここを避ける）。
 */
async function reserveCrystalSlots() {
  const reserved = [];
  const slots = CANVAS_MODE ? resolveCanvasBottomBands(CRYSTAL_SLOTS) : CRYSTAL_SLOTS;
  for (const slot of slots) {
    const size = await assetSize(CRYSTAL_BASE, slot.name);
    let done = null;

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const worldX = between(slot.x0, slot.x1 - size.w);
      const rect = {
        ...size,
        base: CRYSTAL_BASE,
        name: slot.name,
        x: Math.round(((worldX % TILE_WIDTH) + TILE_WIDTH) % TILE_WIDTH),
        y: Math.round(between(slot.y0, slot.y1)),
      };
      if (!fits(rect, MIN_GAP)) continue;
      // above-near は「パネルの裏に完全に隠れる」ことが前提の枠なので、
      // キープアウト（＝パネルに掛からないこと）の対象から外す。
      if (!slot.behindPanel && !clearOfUiPanel(rect)) continue;
      placed.push(rect);
      done = rect;
      break;
    }

    if (!done) console.log(`WARNING: could not reserve crystal slot "${slot.key}"`);
    else reserved.push({ ...slot, rect: done });
  }
  return reserved;
}

async function build() {
  await reserveCrystalSlots();
  if (CANVAS_MODE) {
    // 未開封セル（covered）と赤セルは、クリスタルと同じく見える位置を先に
    // 押さえる（帯が狭く、あとから探しても取れないため）。青は可視性を
    // 問わず存在だけ保証する（reserveBlueCell のコメント参照）。
    await reserveRedCell();
    await reserveVisibleCell("covered", COVERED_RESERVE_SHAPES);
    await reserveBlueCell();
  }

  // 区画はスマホのビューポート（〜390x844）より小さめに取り、
  // どの位置を切り取っても複数のモチーフが入るようにする。
  // CANVAS_MODE はワールド=キャンバスそのものなので、区画をさらに小さくして
  // 390x844の中に複数の島が収まるようにする。
  const islands = CANVAS_MODE ? seedIslands(150, 170) : seedIslands(430, 380);

  for (const island of islands) {
    // 1. 島の核。大きな島ほど核も大きい形状から選ぶ。
    const coreName = `${pickPalette()}-${pick(CORE_SHAPES)}`;
    const coreSize = await assetSize(AUTOTILE_BASE, coreName);
    // 核は種の近くに置きたいが、隣の島が既に占めている場合もあるので、
    // 少し離れた位置まで探して島ごと捨てないようにする。
    const core = settleToward(AUTOTILE_BASE, coreName, coreSize, island.x, island.y, 26, reach(300, 140), 18, 54);
    if (!core) continue;

    // 2. 衛星セル。島ごとに個数を大きく変えることで、密集した群島と
    //    ぽつんと1つだけの島が混ざり、密度に粗密が出る。
    const satelliteCount = Math.floor(between(1, 6));
    for (let i = 0; i < satelliteCount; i += 1) {
      const name = `${pickPalette()}-${pick(SATELLITE_SHAPES)}`;
      const size = await assetSize(AUTOTILE_BASE, name);
      // 島の中の隙間は小さく取り、寄り添って見えるようにする
      settleToward(AUTOTILE_BASE, name, size, island.x, island.y, 22, reach(400, 110), 5, 20);
    }

    // 3. クリスタル。セルの縁のくぼみに小さな隙間で挟み込む。
    //    同じ島に同じ種類を置かないことで、同じ絵が並ぶ人工的な列を防ぐ。
    //    CANVAS_MODE では予約枠で確保した4つ（全種類1つずつ）で打ち止めにする。
    const crystalCount = CANVAS_MODE ? 0 : Math.floor(between(0, 2.7));
    const usedCrystals = new Set();
    for (let i = 0; i < crystalCount; i += 1) {
      const remaining = CRYSTAL_WEIGHTS.filter((c) => !usedCrystals.has(c.name));
      if (remaining.length === 0) break;
      const name = pickWeighted(remaining, "name");
      usedCrystals.add(name);
      const size = await assetSize(CRYSTAL_BASE, name);
      settleToward(CRYSTAL_BASE, name, size, island.x, island.y, 30, reach(400, 90), 3, 12);
    }
  }

  // タイル幅によらず密度を揃える。狭いタイルほど回り込み判定で棄却されやすく、
  // 島を撒くだけでは中央に大きな空白が残ることがある。
  // CANVAS_MODE は「広いワールドの一部を覗く」前提が無く、画面そのものが
  // 全域なので、元の密度(1/60000px²)だと余白だらけに見える。総柄にするため濃くする。
  const density = CANVAS_MODE ? 3200 : 60000;
  await fillGaps(Math.round((TILE_WIDTH * WORLD_HEIGHT) / density));

  if (CANVAS_MODE) {
    const blues = placed.filter((p) => p.name.startsWith("open-blue-")).length;
    if (blues < 1) console.log("WARNING: open-blue が1つも置かれなかった");
  }

  return placed;
}

/**
 * 特定パレットのセルを1つだけ、見える位置に先に確保する（CANVAS_MODE 専用）。
 *
 * 赤セルで最初に発見した問題: 個数だけ揃えても、セルはパネルに重なってよい
 * 規則のせいで、普通に撒くとパネルの裏や画面外にほぼ隠れてしまう
 * （実測: 生成後に1つ塗り替える方式だと3シードとも可視率 0〜26% だった）。
 * 空きが構造的に少ないのが原因なので、クリスタルと同じく島を撒く前に
 * 場所を押さえる。
 *
 * のちに covered（未開封セル）でも同じ問題を確認した。PALETTE_WEIGHTS の
 * 重みは covered 62 / open-blue 38 で「雪原が主役」の意図だが、重みは
 * 「置かれる個数」にしか効かず「見える位置に置かれるか」は別問題。実際、
 * 既定シードでは covered が1個しか置かれず、しかもその1個がホーム画面の
 * パネル裏にほぼ収まっていた＝ユーザーの目には未開封セルが一切見えない
 * 状態になっていた。covered も赤と同じ理由でここに追加した。
 *
 * 押さえ方の条件:
 *   - 端で回り込まないこと。配置はトーラスなので右端をまたぐセルは左端にも
 *     出る。同じ色が画面の左右に2つ見えると「1つ」の想定に反する。
 *   - 可視面積が不透明部分の面積の VISIBLE_MIN_RATIO 以上あること。
 *   - 形状は小〜中型に限る。差し色（赤）はもちろん、主役の covered でも
 *     いちばん大きい塊がこれ1個で占有すると他のモチーフの置き場が無くなる。
 *
 * 青は抽選（open-blue の重み38）に任せる。実測でどのシードも4〜5個出る。
 */
const VISIBLE_MIN_RATIO = 0.45;

/** 画面内かつパネルの外にある不透明部分の面積。パネルは不透明なので裏は見えない扱い。 */
function visibleArea(p) {
  const overlap = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  const x0 = p.x + p.ox;
  const y0 = p.y + p.oy;
  const onScreen = overlap(x0, x0 + p.ow, 0, WORLD_WIDTH) * overlap(y0, y0 + p.oh, 0, WORLD_HEIGHT);
  const behindPanel =
    overlap(x0, x0 + p.ow, UI_KEEPOUT.x0, UI_KEEPOUT.x1) *
    overlap(y0, y0 + p.oh, UI_KEEPOUT.y0, UI_KEEPOUT.y1);
  return Math.max(0, onScreen - behindPanel);
}

const RESERVED_CELL_SHAPES = ["square", "wide", "tall", "l", "l-rotated"];

/**
 * covered 専用の縮小形状セット。
 *
 * 赤と covered を両方とも上下の帯（高さ102〜110px）に確保しようとすると、
 * 既に確保済みのクリスタル3個と場所を取り合って失敗率が上がる。
 * covered は l/l-rotated（192x192、キャンバス幅の半分）を候補から外す。
 * 赤は元から動いていた組み合わせなので RESERVED_CELL_SHAPES のまま変えない。
 */
const COVERED_RESERVE_SHAPES = ["square", "wide", "tall"];

/**
 * 帯（高さ102〜110px、幅390px）は crystal 3個 + 赤1個で既にかなり埋まっており、
 * covered をそこへ「不透明部分の45%以上」で割り込ませようとすると、実測で
 * 約半分のシードが確保に失敗する（既存アイテムと y 帯が重なり、x の空きも
 * 128px 未満に断片化するため）。1回で失敗させず、条件を段階的に緩めて
 * 再探索する。
 *
 * 「見える位置」を要求する場合（赤・covered）は探索を2段に分ける。
 *   1st: 十分見えている（VISIBLE_MIN_RATIO 以上）位置を探す
 *   2nd: 見つからなければ、noPanelSliver だけを満たす位置で妥協する
 *        （見えなくてもいいが、中途半端な覗きにだけはしない）
 * 可視性を要求しない場合（青）は 2nd から始める。
 *
 * どちらの段も noPanelSliver は必ず通すので、中途半端な覗きは絶対に出ない。
 */
async function reserveVisibleCell(prefix, shapes = RESERVED_CELL_SHAPES, { requireVisible = true } = {}) {
  const passes = requireVisible ? [true, false] : [false];

  for (const wantVisible of passes) {
    for (let attempt = 0; attempt < 1200; attempt += 1) {
      const name = `${prefix}-${pick(shapes)}`;
      const size = await assetSize(AUTOTILE_BASE, name);
      if (size.w > WORLD_WIDTH) continue;

      const rect = {
        ...size,
        base: AUTOTILE_BASE,
        name,
        x: Math.round(between(0, WORLD_WIDTH - size.w)),
        // y はキャンバス内に完全に収める（上下端でスプライトが物理的に
        // 切れて見えるのを防ぐ。touchesWorld の CANVAS_MODE 分岐と同じ理由）。
        y: Math.round(between(0, WORLD_HEIGHT - size.h)),
      };
      if (!noPanelSliver(rect)) continue;
      if (!notRowAligned(rect)) continue;
      if (wantVisible) {
        const ratio = visibleArea(rect) / (rect.ow * rect.oh);
        if (ratio < VISIBLE_MIN_RATIO) continue;
      }
      if (!fits(rect, MIN_GAP)) continue;

      placed.push(rect);
      return rect;
    }
  }

  console.log(`WARNING: ${prefix} セルの配置を確保できなかった`);
  return null;
}

async function reserveRedCell() {
  return reserveVisibleCell("open-red");
}

/**
 * 青ベースを最低1個、存在だけ保証する。
 *
 * 赤・covered と違って「見える位置」までは要求しない（もとの要件は
 * 「青ベースを1つ以上」で可視性の言及が無い）。requireVisible: false は
 * 2nd段（ほぼ隠れている位置）から探索するので、可視性は問わないが
 * noPanelSliver は変わらず効くため、中途半端な覗きにはならない。
 *
 * これが要る理由: 赤とcoveredの確保が rand() を追加で消費するようになり、
 * 以降の島・fillGapsで引かれる色の乱数列がシードごとにずれた結果、
 * 抽選（covered 62 / open-blue 38）だけに任せていた「青が1つ以上」が
 * 一部のシードで満たされなくなった（実測で確認済み）。可視性を問わない
 * 低コストな保証を足すことで、この巻き添えを防ぐ。
 */
async function reserveBlueCell() {
  return reserveVisibleCell("open-blue", RESERVED_CELL_SHAPES, { requireVisible: false });
}

/**
 * 1タイル分の配置を、ワールド全体へ横に複製する。
 *
 * k = 0..TILE_REPEATS-1 は常に出す。加えて k = -1 と k = TILE_REPEATS は、
 * ずらした矩形がワールドに掛かるものだけ出す（タイル境界をまたぐモチーフの
 * 見切れ分）。全部出すとDOMノードが無駄に増える。
 */
function expandTiles(tileItems) {
  const out = [];
  for (let k = -1; k <= TILE_REPEATS; k += 1) {
    for (const [srcIndex, p] of tileItems.entries()) {
      const x = p.x + k * TILE_WIDTH;
      const inside = x < WORLD_WIDTH && x + p.w > 0;
      const isInteriorTile = k >= 0 && k < TILE_REPEATS;
      if (!isInteriorTile && !inside) continue;
      out.push({ ...p, x, srcIndex });
    }
  }
  return out;
}

/**
 * 画面に破片しか映らない複製を落とす（CANVAS_MODE 専用）。
 *
 * 配置はトーラスなので、右端をまたぐモチーフは左端にも出る。片方が実体で
 * もう片方が数pxの破片、ということが起きる。破片の側だけ落とせば実体は
 * 残るので、密度を落とさずにノイズだけ消える。
 * `hasReadableCopy` は「1枚でも読めれば配置を採用する」判定なので、
 * 残った破片はここで初めて取り除かれる。
 *
 * さらに CANVAS_MODE では、両方の複製が「読める」大きさで残った場合に
 * **片方だけを残す**。タイリングしない一枚絵なので、同じ絵が左右の端に
 * 1つずつ出ると、同じ高さに同じモチーフが2つ並んだ横一線に見えてしまう
 * （指摘の一因）。可視面積が大きい側を実体として残す。
 */
function dropSliverCopies(items) {
  const readable = items.filter((p) => isReadableCopy(p, 0));

  const best = new Map();
  for (const p of readable) {
    const area = onScreenExtent(p, 0).vw * onScreenExtent(p, 0).vh;
    const prev = best.get(p.srcIndex);
    if (!prev || area > prev.area) best.set(p.srcIndex, { item: p, area });
  }
  const kept = [...best.values()].map((v) => v.item);

  const dropped = items.length - kept.length;
  if (dropped > 0) {
    console.log(`dropped copies: ${dropped} (破片 or 端の重複)`);
  }
  return kept;
}

function serialise(items) {
  const lines = items
    .map((p) => {
      const base = p.base === CRYSTAL_BASE ? "CRYSTAL_BASE" : "AUTOTILE_BASE";
      return `  { base: ${base}, name: "${p.name}", x: ${p.x}, y: ${p.y}, w: ${p.w}, h: ${p.h} },`;
    })
    .join("\n");

  return `// このファイルは scripts/generate-background-world.mjs が生成した固定値です。
// 手で座標を直した場合は、再実行で上書きされるため注意してください。

export const CRYSTAL_BASE = "${CRYSTAL_BASE}";
export const AUTOTILE_BASE = "${AUTOTILE_BASE}";

export const WORLD_WIDTH = ${WORLD_WIDTH};
export const WORLD_HEIGHT = ${WORLD_HEIGHT};

export type BackgroundPlacement = {
  base: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const BACKGROUND_WORLD: BackgroundPlacement[] = [
${lines}
];
`;
}

/** CSS の drop-shadow(4px 5px 0 rgba(30,55,105,0.28)) を再現した影を作る */
async function shadowOf(file) {
  const alpha = await sharp(file)
    .ensureAlpha()
    .extractChannel(3)
    .linear(0.28, 0)
    .toBuffer();
  const meta = await sharp(file).metadata();
  return sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r: 30, g: 55, b: 105 },
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

async function renderReview(items) {
  mkdirSync(REVIEW_DIR, { recursive: true });

  const shadows = [];
  const layers = [];
  for (const p of items) {
    const file = path.join(PUBLIC_DIR, p.base, `${p.name}.png`);
    shadows.push({ input: await shadowOf(file), left: p.x + 4, top: p.y + 5 });
    layers.push({ input: file, left: p.x, top: p.y });
  }

  // sharp は負の left/top を受け付けないので、一度大きめの台紙に描いてから切り出す
  const PAD = 700;
  const canvas = await sharp({
    create: {
      width: WORLD_WIDTH + PAD * 2,
      height: WORLD_HEIGHT + PAD * 2,
      channels: 4,
      background: { r: 185, g: 205, b: 246, alpha: 1 },
    },
  })
    .composite(
      [...shadows, ...layers].map((layer) => ({
        ...layer,
        left: layer.left + PAD,
        top: layer.top + PAD,
      })),
    )
    .png()
    .toBuffer();

  const world = await sharp(canvas)
    .extract({ left: PAD, top: PAD, width: WORLD_WIDTH, height: WORLD_HEIGHT })
    .png()
    .toBuffer();
  writeFileSync(path.join(REVIEW_DIR, `world-overview${SUFFIX}.png`), world);

  if (TILE_REPEATS > 1) {
    // 継ぎ目の検査: タイリングの定義そのもの。重なる全領域で
    // pixel(x, y) === pixel(x + TILE_WIDTH, y) なら継ぎ目は原理的に存在しない。
    const { data, info } = await sharp(world)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let mismatches = 0;
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x + TILE_WIDTH < info.width; x += 1) {
        const a = (y * info.width + x) * info.channels;
        const b = (y * info.width + x + TILE_WIDTH) * info.channels;
        if (
          data[a] !== data[b] ||
          data[a + 1] !== data[b + 1] ||
          data[a + 2] !== data[b + 2]
        ) {
          mismatches += 1;
        }
      }
    }
    console.log(
      mismatches === 0
        ? `seam check: PASS (tile ${TILE_WIDTH}px repeats cleanly)`
        : `seam check: FAIL (${mismatches} mismatching pixels)`,
    );

    // タイル境界に目印を入れた版。繰り返しのリズムを目で判断するため。
    const marks = [];
    for (let k = 1; k < TILE_REPEATS; k += 1) {
      marks.push({
        input: {
          create: {
            width: 3,
            height: WORLD_HEIGHT,
            channels: 4,
            background: { r: 255, g: 90, b: 60, alpha: 1 },
          },
        },
        left: k * TILE_WIDTH,
        top: 0,
      });
    }
    await sharp(world)
      .composite(marks)
      .png()
      .toFile(path.join(REVIEW_DIR, `world-overview${SUFFIX}-marked.png`));

    // 継ぎ目付近の拡大（境界をまたぐ帯）
    const seamW = 700;
    await sharp(world)
      .extract({
        left: Math.max(0, TILE_WIDTH - seamW / 2),
        top: 0,
        width: seamW,
        height: WORLD_HEIGHT,
      })
      .png()
      .toFile(path.join(REVIEW_DIR, `seam${SUFFIX}.png`));
  }

  // CANVAS_MODE はワールド=キャンバスそのものなので、切り取りは不要
  // （world-overview がそのまま最終的な見た目になる）。
  if (CANVAS_MODE) return;

  // 各画面比率で中央を切り取る = 実際のカメラの見え方
  const VIEWPORTS = [
    ["iphone-se-375x667", 375, 667],
    ["iphone-390x844", 390, 844],
    ["iphone-max-430x932", 430, 932],
    ["tablet-768x1024", 768, 1024],
    ["desktop-1440x900", 1440, 900],
    ["desktop-1920x1080", 1920, 1080],
  ];
  for (const [name, w, h] of VIEWPORTS) {
    await sharp(world)
      .extract({
        left: Math.round((WORLD_WIDTH - w) / 2),
        top: Math.round((WORLD_HEIGHT - h) / 2),
        width: w,
        height: h,
      })
      .png()
      .toFile(path.join(REVIEW_DIR, `crop-${name}${SUFFIX}.png`));
  }
  console.log(`review images -> ${REVIEW_DIR}`);
}

const tileItems = await build();
const expanded = expandTiles(tileItems);
const items = CANVAS_MODE ? dropSliverCopies(expanded) : expanded;

// WRITE_WORLD=0 のときは確認画像だけ作り、本番の配置は差し替えない（試作用）
// OUT_FILE で出力先を変えられる（CANVAS_MODE の複数シード比較で使う）。
const OUT_FILE = process.env.OUT_FILE ?? "src/lib/background-world.ts";
if (process.env.WRITE_WORLD !== "0") {
  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, serialise(items));
  console.log(`-> ${OUT_FILE}`);
}

const crystals = items.filter((p) => p.base === CRYSTAL_BASE).length;
console.log(`world: ${WORLD_WIDTH}x${WORLD_HEIGHT}  tile: ${TILE_WIDTH}x${WORLD_HEIGHT} x${TILE_REPEATS}`);
console.log(`tile items: ${tileItems.length}  ->  world items: ${items.length} (cells ${items.length - crystals}, crystals ${crystals})`);

await renderReview(items);
