# 背景ワールドの生成

固定キャンバス（390x670）の背景に置くセルとクリスタルの座標を、ビルド前に
一度だけ計算して `src/lib/background-world.ts` へ書き出す仕組みの記録。

ランタイムは乱数を一切持たない。生成物はコミット済みの固定リストで、
`PixelBackdrop`（`src/components/ui/PixelUI.tsx`）がそれを読むだけ。

## ファイル

| ファイル | 役割 |
|---|---|
| `scripts/generate-background-world.mjs` | 生成。配置の探索と書き出し |
| `scripts/background-world-rules.mjs` | 見え方の規則。生成と検証が共有する |
| `scripts/check-background-world.mjs` | 検証。出来上がった座標を独立に測り直す |
| `src/lib/background-world.ts` | 生成物。手で編集しない |

規則を `generate` 側だけに書くと検証が素通りするので、**判定に関わる定数と
関数は `background-world-rules.mjs` に置く**こと。

## 使い方

```bash
# 既定シードで生成（コミット済みの背景を再現する）
node scripts/generate-background-world.mjs

# 検証（引数なしなら src/lib/background-world.ts を見る）
node scripts/check-background-world.mjs
```

### シードを選び直す

制約を変えると同じシードでも別の絵になるので、規則をいじったら選び直す。

```bash
# 書き出さずに候補だけ作って検証する
for SEED in 6001 6002 6003 6004 6005; do
  SEED=$SEED WRITE_WORLD=1 OUT_FILE=/tmp/s-$SEED.ts \
    node scripts/generate-background-world.mjs > /dev/null
done
node scripts/check-background-world.mjs /tmp/s-*.ts
```

「✅ 問題なし」かつ可視セルが3個以上のものが候補。最後は必ず実画面で見る
（下記）。決めたら `DEFAULT_SEED` をその値にして、引数なしの生成が
コミット済みの `background-world.ts` と一致する状態に戻す。

### 環境変数

| 変数 | 既定 | 意味 |
|---|---|---|
| `SEED` | `DEFAULT_SEED` | 乱数シード |
| `WRITE_WORLD` | `1` | `0` で書き出さず確認画像だけ作る |
| `OUT_FILE` | `src/lib/background-world.ts` | 書き出し先 |
| `REVIEW_DIR` | `/tmp/gradient-sweeper-background-review` | 確認画像の出力先 |
| `CANVAS_MODE` | `1` | `0` で旧方式（2880x1620 をカメラで覗く） |

## 実画面での確認

確認画像（`world-overview-x1.png`）にはUIパネルが写らない。覗きや横並びは
パネルとの関係で決まるので、**必ずブラウザで見る**こと。

```bash
npm run dev
```

エージェント環境には Chromium が入っている（`/opt/pw-browsers/`）。
`playwright-core` はプロジェクトの依存ではないので、スクリプトは
リポジトリに置かず使い捨てで書く。倍率1になるビューポートを指定すると、
DOM の座標がそのままキャンバス座標になって読みやすい。

```js
import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({
  viewport: { width: 390, height: 670 }, // 倍率1
  deviceScaleFactor: 2,
});
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForSelector("[class*='scene']");
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/home.png" });
await browser.close();
```

### 遮蔽物の実測を取り直す

`HOME_OCCLUDERS` はレイアウトを変えたら合わなくなる。同じ要領で開いて、
`.scene` の `transform` から倍率を取り、キャンバス座標へ戻して読む。

```js
const scene = document.querySelector("[class*='scene']");
const sr = scene.getBoundingClientRect();
const scale = new DOMMatrixReadOnly(getComputedStyle(scene).transform).a;
const toCanvas = (el) => {
  const r = el.getBoundingClientRect();
  return {
    x0: Math.round((r.left - sr.left) / scale),
    x1: Math.round((r.right - sr.left) / scale),
    y0: Math.round((r.top - sr.top) / scale),
    y1: Math.round((r.bottom - sr.top) / scale),
  };
};
```

## 守っている規則

### 1. クリスタルは画面から欠けない

クリスタルは1つの塊として読ませたいので、上下左右のどこで切れても破綻する。
`touchesWorld` は `CANVAS_MODE` のとき「掛かっている」ではなく
「完全に収まっている」を採用条件にする。

x はトーラス（円環）なので左右は回り込むが、**上下は回り込む先が無い**
ただのキャンバスの外で、はみ出しは折り返しではなく素の切れ端になる。

セルは端をまたぐ配置を意図的に許している（矩形の「額縁」感を消すため）。
ただし y だけは同じ理由で完全に収める。

### 2. パネルの縁から「ちょっとだけ」覗かない

セルはパネルに重なってよい（クリスタルと違いキープアウトを適用しない）。
ただし重なりが浅いと縁から細い帯だけが覗き、ノイズにしか見えない。

判定は面積比ではなく**細さそのもの**で行う。大きい形状ほど同じ細さでも
面積比が上がってしまい、判定がぶれるため。見えている塊が `MIN_ONSCREEN`
（36px = ゲームの1セル分）角の正方形を含むことを要求する。完全に隠れて
いるものは見えないので許容する。

対象はメインメニューだけ（指定）。

#### 遮蔽物は実測の矩形を使う

`UI_KEEPOUT` は全ページの和に落ち影の余裕を足した広めの矩形で、クリスタルを
避けさせるためのもの。**セルの見え方の判定には使えない。**

ホームはパネル本体が y423 で終わり、言語トグルとの間（423〜437）とトグルの
左右には背景が見えている。この差を無視して `UI_KEEPOUT` で「隠れている」と
判定すると、実際には数px〜十数px覗く配置を通してしまう（実測で 3%・7%・8%・
12% の覗きが各シードに残っていた）。

#### 可視領域はコの字になる

遮蔽物が2つあるので可視領域は単純な帯にならない。トグルを無視して
「パネルの下に66pxの帯がある」と判定した配置が、トグルに分断されて
14px・38px・23px の細切れになっていた。

`largestVisibleSide` は遮蔽物の辺でグリッドに切り、遮蔽されていないセルだけ
から成る矩形を総当たりして最大の短辺を返す。グリッドはたかだか 4x4。

### 3. 横一列に並ばない

パネルは幅320・高さ303でキャンバス中央を占める。**セルが読める大きさで
見えるのは上下の帯だけ**なので、放っておくと同じ帯に入った2〜3個が同じ
高さに揃い、画面を横切る一本の線に見える。

見えているモチーフ同士で、横に離れている（x が重なっていない）なら中心Yを
`ROW_MIN_OFFSET`（40px）以上ずらす。隠れているものは線を作らないので対象外。
x が重なっている縦の並びは「積み上がった島」に見えるので、これも対象外。

#### 下側クリスタル2個は例外

`y[524,626]` の帯に両方の不透明部分を収める制約から、取りうる中心は

- `cluster-medium` 中心 ∈ [566, 584]
- `cluster-wide` 中心 ∈ [546.5, 603.5]

となり、**中心のずれは原理的に 37.5px が上限**。40px は達成できないので、
この2つだけは上限いっぱいまで離すことで代えている。シルエットが縦長84pxと
平たい45pxで大きく違うため、この差なら横一線には見えない。

検証スクリプトもクリスタル同士のペアは除外している。

### 4. 判定は x の正規化後に行う

`settleToward` は x をタイル座標のまま探索し、採用が決まってから
`[0, 390)` へ正規化する。正規化前の x で見え方を判定すると、判定時は画面外
だったものが正規化で画面内へ移動し、覗きのまますり抜ける。

> 実測: `x=-373` で「完全に隠れている」と判定 → 正規化後 `x=17` で
> パネル左に 14px の細い覗きになっていた。

`screenRectOf` が正規化とトーラス複製の解決をまとめて行う。**見え方に
関わる判定はすべてこれを通す。**

### 5. 端をまたぐ複製は1つだけ残す

一枚絵なのでタイリングしない。左右端をまたぐ配置が両端に複製されると、
同じ絵が同じ高さに2つ出て横並びの原因になる（あるシードでは同一 y に3つ
並び、画面を横切る一本の帯になっていた）。

`dropSliverCopies` が可視面積の大きい側だけを残す。`screenRectOf` が選ぶ
複製と同じものなので、判定と実際に描かれるものが一致する。

### 6. 色ごとの個数と可視性を保証する

抽選の重み（`covered` 62 / `open-blue` 38）は「置かれる個数」にしか効かず、
「見える位置に置かれるか」は別問題。セルはパネルに重なってよい規則なので、
普通に撒くとパネルの裏や画面外にほぼ隠れてしまう。

- `open-red` … 見える位置に1個。差し色なので形状は小〜中型に限る
- `covered` … 見える位置に1個。重み62%の「雪原が主役」を実際に見える形で
  保証する。`l`/`l-rotated`（192x192）は帯を占有しすぎるので候補から外す
- `open-blue` … 可視性は問わず存在だけ保証する

いずれも島を撒く前に場所を押さえる（帯が狭く、あとから探しても取れない）。

> `open-blue` の保証が要る理由: 赤と covered の確保が `rand()` を追加で
> 消費するようになり、以降の抽選の乱数列がシードごとにずれた結果、
> 「青が1つ以上」が一部のシードで満たされなくなった。

## 直したくなったときの勘所

- **密度を上げたい** → `density`（既定 3200）を小さくする。ただし制約が
  厳しいので、置ける数は密度より制約で決まっていることが多い
- **覗きの許容を変えたい** → `MIN_ONSCREEN`。下げると細い帯を許すようになる
- **横並びの許容を変えたい** → `ROW_MIN_OFFSET`。上げるほど厳しくなるが、
  上下の帯の深さ（上 y0∈[0,84] / 下 y1∈[459,524]）が上限を決める
- **キャンバス高さを変えた** → `CANVAS_HEIGHT` と `.scene { height }` の
  両方、さらに `CANVAS_UI_KEEPOUT`・`CANVAS_CRYSTAL_SLOTS`・
  `CANVAS_BOTTOM_BANDS`・`HOME_OCCLUDERS` の実測を取り直す

規則を変えたら必ず、複数シードで `check-background-world.mjs` を通してから
実画面で確認すること。数値が通っても絵が良いとは限らない。
