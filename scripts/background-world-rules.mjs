/**
 * 固定キャンバス背景の「見え方」の規則。
 *
 * `generate-background-world.mjs`（生成）と `check-background-world.mjs`（検証）の
 * 両方がここを読む。規則を片方だけ直すと検証が素通りするので、判定に関わる
 * 定数と関数はすべてこのファイルに置くこと。
 *
 * 背景と経緯は docs/technical/BACKGROUND-WORLD.md にまとめてある。
 */

/**
 * 固定キャンバスの寸法。
 * `src/components/ui/pixel-ui.module.css` の `.scene` と必ず一致させること。
 */
export const CANVAS_WIDTH = 390;
export const CANVAS_HEIGHT = 670;

/**
 * メインメニュー（ホーム）の遮蔽物。倍率1（ビューポート 390x670）の
 * DOM から実測した値。
 *
 * `UI_KEEPOUT`（生成スクリプト側）は全ページの和に落ち影の余裕を足した
 * 広めの矩形で、クリスタルを避けさせるためのもの。セルの見え方の判定には
 * 使えない。ホームではパネル本体が y423 で終わり、言語トグルとの間
 * （423〜437）とトグルの左右には背景が見えているためで、この差を無視すると
 * 「隠れている」と判定した配置が実際には十数px覗く。
 *
 * レイアウトを変えたら実測を取り直すこと（取り方は
 * docs/technical/BACKGROUND-WORLD.md）。
 */
export const HOME_OCCLUDERS = [
  { x0: 35, x1: 355, y0: 120, y1: 423 }, // .panel
  { x0: 134, x1: 256, y0: 437, y1: 488 }, // .languageToggle
];

/**
 * モチーフとして読める最小の大きさ。ゲームの1セル分（36px）を基準にする。
 *
 * 実測では、意味のあるモチーフの可視幅・可視高さは 53px 以上、
 * ノイズに見えたものは 28px 以下と、この境界できれいに分かれていた。
 */
export const MIN_ONSCREEN = 36;

/**
 * 横並びとみなす中心Yの近さ。これ未満なら並んで見えるので配置し直す。
 *
 * パネルが幅320・高さ303でキャンバス中央を占めるため、セルが読める
 * 大きさで見えるのは上下の帯だけになる。放っておくと同じ帯に入った
 * 2〜3個が同じ高さに揃い、画面を横切る一本の線に見える。
 */
export const ROW_MIN_OFFSET = 40;

export const overlap1d = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/** ホームで実際に見えている面積（画面内、かつ遮蔽物の外）。 */
export function homeVisibleArea(x0, y0, x1, y1) {
  const onScreen = overlap1d(x0, x1, 0, CANVAS_WIDTH) * overlap1d(y0, y1, 0, CANVAS_HEIGHT);
  let hidden = 0;
  for (const o of HOME_OCCLUDERS) {
    hidden += overlap1d(x0, x1, o.x0, o.x1) * overlap1d(y0, y1, o.y0, o.y1);
  }
  return Math.max(0, onScreen - hidden);
}

/**
 * 見えている領域に収まる最大の矩形の「短辺」。
 *
 * 見えている領域 = 不透明部分 ∩ 画面 − 遮蔽物。遮蔽物が2つあるので
 * この領域はコの字になり、単純な帯の引き算では測れない。実際、
 * 言語トグルを無視して「パネルの下に66pxの帯がある」と判定した配置が、
 * トグルに分断されて 14px・38px・23px の細切れになっていた。
 *
 * 遮蔽物の辺でグリッドに切り、遮蔽されていないセルだけから成る矩形を
 * 総当たりする。グリッドはたかだか 4x4 程度なので計算量は問題にならない。
 */
export function largestVisibleSide(x0, y0, x1, y1) {
  const vx0 = Math.max(x0, 0);
  const vx1 = Math.min(x1, CANVAS_WIDTH);
  const vy0 = Math.max(y0, 0);
  const vy1 = Math.min(y1, CANVAS_HEIGHT);
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
 * 判定に使う「実際に画面へ出る位置」の不透明矩形。
 *
 * 生成側の `settleToward` は x をタイル座標のまま探索し、採用が決まってから
 * [0, CANVAS_WIDTH) へ正規化する。正規化前の x で見え方を判定すると、
 * 判定時は画面外だったものが正規化で画面内へ移動し、覗きのまますり抜ける
 * （実測: x=-373 で「完全に隠れている」と判定 → 正規化後 x=17 でパネル左に
 * 14px の細い覗きになっていた）。
 *
 * 正規化したうえで、トーラスの複製のうち最も画面に出るものを返す。
 * 生成側の `dropSliverCopies` が残すのも可視面積が最大の複製なので、
 * 判定と実際に描かれるものが一致する。
 */
export function screenRectOf({ x, y, ox, oy, ow, oh }) {
  const nx = ((x % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;
  const y0 = y + oy;
  const y1 = y0 + oh;
  let best = null;
  let bestArea = -1;
  for (const shift of [-CANVAS_WIDTH, 0, CANVAS_WIDTH]) {
    const x0 = nx + ox + shift;
    const x1 = x0 + ow;
    const area = overlap1d(x0, x1, 0, CANVAS_WIDTH) * overlap1d(y0, y1, 0, CANVAS_HEIGHT);
    if (area > bestArea) {
      bestArea = area;
      best = { x0, y0, x1, y1 };
    }
  }
  return best;
}

/**
 * メニューパネルの縁から「ほんの少しだけ」覗いていないか。
 *
 * セルはパネルに重なってよい規則（クリスタルと違いキープアウトは適用しない）
 * だが、重なりが浅いと縁から細い帯だけが覗き、ノイズにしか見えない。
 *
 * 面積比で判定すると、大きい形状ほど同じ「細さ」でも比率が上がって判定が
 * ぶれる。見たいのは細さそのものなので、見えている塊が MIN_ONSCREEN 角の
 * 正方形を含むことを要求する。完全に隠れている場合は見えないので許容。
 */
export function isPanelSliver(screenRect) {
  const { x0, y0, x1, y1 } = screenRect;
  if (homeVisibleArea(x0, y0, x1, y1) <= 0) return false;
  return largestVisibleSide(x0, y0, x1, y1) < MIN_ONSCREEN;
}

/** ホームで見えているか（1pxでも見えていれば true）。 */
export function isVisibleOnHome(screenRect) {
  const { x0, y0, x1, y1 } = screenRect;
  return homeVisibleArea(x0, y0, x1, y1) > 0;
}

/**
 * 2つが横一列に並んで見えるか。
 *
 * 見えているもの同士だけを対象にする（隠れているものは線を作らない）。
 * x が重なっている縦の並びは「積み上がった島」に見えるので対象外。
 */
export function looksLikeRow(a, b) {
  if (!isVisibleOnHome(a) || !isVisibleOnHome(b)) return false;
  const acy = (a.y0 + a.y1) / 2;
  const bcy = (b.y0 + b.y1) / 2;
  if (Math.abs(acy - bcy) >= ROW_MIN_OFFSET) return false;
  return overlap1d(a.x0, a.x1, b.x0, b.x1) <= 0;
}
