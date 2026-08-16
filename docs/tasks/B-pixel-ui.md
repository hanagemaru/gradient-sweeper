# B: ゲーム画面以外のピクセル化

## 目的

ホーム・難易度選択・リザルト・ランキングを、ゲーム画面と同じ世界観に揃える。

## 背景

グレイシャーテーマが当たっているのは `/game` だけで、
それ以外は汎用的な Tailwind グラデーションのまま。世界観が分断されている。

採用するフォント構成は、日本語がマルモニカ Regular、英語・数字が VT323。
太字は使用しない。

**着手前にユーザーが方向性を選ぶ必要がある。**
勝手に決めず、案を複数出して選んでもらうこと。

## 現在の決定と引き継ぎ（PR #10）

- 採用方向は `CRYSTAL FIELD`。
- メニューパネルは中明度の青。背景とは独立した CSS レイヤーにする。
- 背景はメニューパネルの位置を避けず、総柄として構成する。
- セルやクリスタルは回転・反転しない。ライティング方向を保持する。
- セル同士、およびセルとクリスタルを重ねない。
- 背景ワールド内ではモチーフを固定ピクセルサイズで配置し、viewport に合わせて
  全体を縮小しない。大きな画面では見える範囲を広げる。
- サイズ差は標準から 2〜3 倍程度まで。`giant-*`（4〜8倍相当）は不採用。
- ランダム配置や BSP の5シード案は不採用。各モチーフの画像パス、x/y 座標、
  幅、高さを配置定義へ明示する固定配置方式で作る。
- ~~最終背景は、画面より大きい1つの背景ワールドを作り、スマホ・タブレット・PCでは
  カメラのように表示範囲を切り替える。~~ → **固定キャンバス方式へ転換**（下記）。
  `background-size: cover` を使わない点は変わらない。
- 背景ワールドの全体確認PNGと、各画面比率の切り取り確認画像も用意する。

現在のローカル作業で作られた BSP・5シード背景比較は不採用の実験であり、
PR #10 の引き継ぎチェックポイントには含めない。

### 固定キャンバス＋レターボックスへの転換（レーンG を本PRに取り込み）

「ビューポート追従カメラ」をやめ、**390x844 を1枚だけ描いて画面に収まるだけ
拡大縮小し、あまりは黒で塗る**方式に変えた。390x844 は対象スマホ5機種
（360/375/390/414/430）の中央値。

転換の理由は背景の設計が1通りで済むこと。旧方式は機種ごとに見える範囲が
変わるため、クリスタルの配置枠を機種別に3帯へ割る必要があった。固定キャンバス
なら実測1つのキープアウトで足りる。

#### 仕組み

`.stage`（黒帯・fixed）→ `.scene`（390x844 のキャンバス）→ `.scroll`
（キャンバス内スクロール）→ `.content` の4層。JSもリサイズ監視も使わない。

```css
transform: scale(min(calc(100vw / 390px), calc(100dvh / 844px), 2.2));
```

長さ同士の割り算にすることで CSS だけで `contain` 相当になる。2.2 は拡大の
上限。さらに、**transform が掛かった要素は `position: fixed` な子孫の
containing block になる**という仕様を利用して、`.backdrop { inset: 0 }` の
基準を実ビューポートからキャンバスへすり替えている。

#### この方式で注意すること

- `.scene` に `flex: 0 0 auto` が要る。`.stage` が flex コンテナなので、
  これが無いと 390px より狭い画面で flex-shrink が効き、transform と
  二重に縮小される（実測: 360x800 で倍率 0.923 のはずが 0.851）。
- **キャンバスの中でビューポート単位（vw/vh/dvh）を使わない。** 実ビューポート
  基準なので、キャンバスだけ拡大縮小してもその値は別の倍率で動き、機種ごとに
  絵が変わってしまう。`.title` の `clamp(31px, 9vw, 40px)` は 35px の固定値に、
  `@media (max-width: 359px)` の詰めルールは削除した。
- `.content { padding-top: 120px }` は背景生成スクリプトの `CANVAS_UI_KEEPOUT` と
  `CANVAS_CRYSTAL_SLOTS` の前提。変えたら実測を取り直して背景を再生成する。
- 中身が 844px を超えるページは `.scroll` だけが縦スクロールし、背景と黒帯は
  動かない。ページ自体はスクロールしない。
- `.stackWide`（440px）はキャンバス幅では 358px 頭打ちになる。ランキングの
  レイアウト幅は旧方式より狭い。

#### 背景モチーフの規則（`scripts/generate-background-world.mjs`）

既定が固定キャンバス方式。`CANVAS_MODE=0` で旧カメラ方式に戻せる。
素で再実行するとコミット済みの `src/lib/background-world.ts` と一致する
（既定シード 20265786 = 比較5案のシード5）。

- 開封セルは **赤ちょうど1つ・青1つ以上・紫なし**。赤は個数だけ合わせても
  パネルの裏や画面外に隠れるので、島を撒く前に可視位置へ予約する
  （`reserveRedCell`）。
- クリスタルは `cluster-large` を不採用。残り3種を1つずつ。
  一番小さい `accent-small` だけパネルの上、残り2つはパネルの下。
- パネル下の2つは上下位置がそろわないよう、帯を2段に割って 44px 空ける。
- **画面端で 36px 未満しか映らないセルは置かない。** 端で切れていないものは
  小さくても対象外（`accent-small` は不透明部分が 34x33 しかない）。

### 背景ワールド実装時に確定したこと（旧カメラ方式のときの記録）

> 上の固定キャンバス転換により、この節のうち**ワールド寸法 2880x1620・横2回の
> タイリング・機種別の `CRYSTAL_SLOTS`・`clamp(92px, 15vh, 132px)` 依存**は
> 現行の本番には当てはまらない。旧方式（`CANVAS_MODE=0`）のコードは残して
> あるので、その挙動の記録として置いてある。
> 島の組み方・トーラス・`MIN_GAP`・不透明部分で判定する、といった配置の考え方は
> 固定キャンバスでもそのまま生きている。

- **背景レイヤー（`.backdrop`）は `position: fixed`。** `absolute` にすると高さが
  `.scene` に追従してしまい、次の2つが同時に起きる。
  1. `layout.tsx` の `min-h-screen`（= `100vh`）と `.scene` の `100dvh` がずれる分だけ
     ページ下端に `globals.css` の `body{background:#fff}` が露出する（iOS で顕著）。
  2. パネルの高さが変わるたびにワールドが再センタリングされ、画面遷移やタブ切替で背景がずれる。
  グラデーションも `.scene` ではなく `.backdrop` に置く。
  なお `layout.tsx` の `min-h-screen` 由来のスクロールは残るが、背景が全面を覆うため見えない。
  根治には `min-h-dvh` への変更が必要だが、`/game` と共有のファイルなので別タスク。
- **ワールド寸法は 2880x1620。** 可視域 = ビューポートなので、1920x1080 / 2560x1440 を内包する必要がある。
- **アトラスから大型形状を追加できる。ただし凹みは右上と左下だけ。**
  内角素材は covered が C10(tr)/C11(bl)、open が O7(tr)/O15(bl) しかなく、回転・反転は禁止のため、
  作れるのは左上から右下へ降りる階段状の輪郭に限られる。右下・左上に凹む形は元PNGの手描き追加が必要。
  この制約下で `ridge-wide` / `bluff-tall` / `terrace` / `headland` を追加済み。
- **配置は「島（クラスター）」単位で組む。** 等間隔に散らすとグリッドに見える。
  大型形状を核にして、中小セルを外側から内側へ寄せて（衝突する直前で止めて）積む。
  島の種は層化ジッタで撒く。完全な乱数だと大きな空白ができ、カメラが常に中央を映す以上、
  スマホでその空白を引くと背景がほぼ無地になる。
- **同じ島に同じクリスタルを2つ置かない。** 同じ絵が近くに並ぶと一気に人工的に見える。
- **背景ワールドは横方向に2回タイリングする（タイル幅 1440）。**
  一点物より、ある程度のリズムがあったほうが良いという判断。ただし繰り返すのは
  モチーフ単位ではなく「自然な風景のアセンブリ」1タイル分。
  継ぎ目を出さないため **x 方向をトーラスとして扱う**。衝突判定も距離判定も
  `-TILE_WIDTH / 0 / +TILE_WIDTH` の3通りで見て、右端をまたぐモチーフを左端へ回り込ませる。
  ワールド中央 1440 はタイル境界と一致する。
- **同じアセット名どうしは 470px 以上離す。** スマホ幅より大きい距離なので、
  同じ絵が1画面に2つ入ることがほぼ無くなる。
- **モチーフ同士の最小すきまは 15px（`MIN_GAP`）。** それ以前は最小 5px の組があり、
  そこだけ2つの絵がくっついて1つの塊に見えていた。すきまは矩形間の分離距離
  `max(dx, dy)` で測る。各配置のすきま幅（ばらつき）はそのままに、下限だけを上げている。
- **見え方の判定は PNG の矩形ではなく不透明部分の矩形で行う。**
  クリスタルの絵は PNG の下寄りに描かれていて上に透明の余白がある
  （`cluster-wide` は 120x80 のうち上 35px が透明）。矩形で判定すると、
  実際には何も映らない位置を「見えている」と誤判定する。
- **クリスタルはUIパネルに重ねない（セル系モチーフは重ねてよい）。**
  カメラがワールド中央固定なので、パネルの占める範囲はワールド座標で決まる。
  スマホ5サイズ × 本番4ページで `.stack` を実測した和が `x[1241,1639] y[476,1090]`。
  余裕を足した `x[1233,1647] y[468,1096]` をキープアウトとして、クリスタルだけ弾く。
- **パネルの上下にクリスタルを1つずつ見せる枠を予約している（`CRYSTAL_SLOTS`）。**
  パネル上端は `.content` の `padding-top: clamp(92px, 15vh, 132px)` 依存なので、
  ワールド座標では画面が大きいほど上へ動く（430x932 で 476、360x640 で 586）。
  そのため「可視かつパネルより上」の帯は5サイズで共通部分が無く、
  **1つのクリスタルを全機種でパネルの上に見せることは原理的にできない**。
  上側は2枠に分け、どの機種でも「完全に見える」「完全にパネルの裏」「画面外」の
  いずれかになるようにしてある。半分だけパネルに潜り込む見え方を作らないのが条件。
  枠は帯が数十pxしかないので**島を撒く前に**確保する。3枠は種類を重複させない。
  パネル実測値と各枠の導出は `scripts/generate-background-world.mjs` のコメントにある。
  レイアウト（パネル幅・`.content` の padding）を変えたらこの定数も取り直すこと。

## 背景用セル画像の管理

手作業で修正する元画像と、自動生成される派生画像を混同しないこと。

### 手作業で修正する元画像

- `public/assets/frostbound/motifs-v2/cell-covered-large.png`
- `public/assets/frostbound/motifs-v2/cell-covered-l.png`
- `public/assets/frostbound/motifs-v2/cell-covered-l-rotated.png`
- `public/assets/frostbound/motifs-v2/l-panel-blue.png`
- `public/assets/frostbound/motifs-v2/cell-open-blue-l-rotated.png`
- `public/assets/frostbound/motifs-v2/cell-open-blue-step.png`
- `public/assets/frostbound/motifs-v2/open-surface-master-blue.png`

これらのPNGを手修正した後に生成スクリプトを実行すると、修正内容を派生画像へ反映できる。
ただし `scripts/generate-open-surface-master.mjs` は
`open-surface-master-blue.png` 自体を作り直す初期化用スクリプトなので、手修正後は実行しない。

### 自動生成される画像

- `public/assets/frostbound/cell-autotile-v2/covered-atlas/`
- `public/assets/frostbound/cell-autotile-v2/open-atlas/`
- `public/assets/frostbound/cell-autotile-v2/covered-*.png`
- `public/assets/frostbound/cell-autotile-v2/open-blue-*.png`
- `public/assets/frostbound/cell-autotile-v2/open-red-*.png`
- `public/assets/frostbound/cell-autotile-v2/open-purple-*.png`
- `public/assets/frostbound/cell-autotile-v2/covered-comparison.png`
- `public/assets/frostbound/cell-autotile-v2/open-comparison.png`

これらを直接修正しても、生成スクリプトの再実行で上書きされる。

### 生成スクリプト

- 未開封セル: `scripts/generate-covered-cell-atlas.mjs`
- 開封セル: `scripts/generate-open-cell-atlas.mjs`
- 開封セル表面マスターの初期生成のみ: `scripts/generate-open-surface-master.mjs`
- 背景ワールドの配置定義: `scripts/generate-background-world.mjs`
  → `src/lib/background-world.ts`（生成物。手で座標を直しても再実行で上書きされる）
  確認用の全景PNGと各画面比率の切り取りは `REVIEW_DIR` 環境変数の場所へ出力する。
  確認専用なのでリポジトリには含めない。

新しい形状を `generate-open-cell-atlas.mjs` に足すときは、`SHAPES` だけでなく
`SURFACE_ORIGINS` にも同じ名前のエントリを追加すること。片方だけだと生成が壊れる。

push 前には、追加・変更した全画像について「元画像／自動生成物／確認専用」を分類し、
格納先と再生成時に上書きされるかをユーザーへ報告すること。

## 触ってよいファイル

- `src/app/page.tsx` と同階層のCSS
- `src/app/ta/`
- `src/app/result/`
- `src/app/ranking/`
- `src/components/ui/` 配下（Button, Modal, LanguageToggle）
- 新規のピクセルUIコンポーネント

## 触ってはいけないファイル

- **`src/components/Icon.tsx`** — ゲーム画面も使う。ここを変えると盤面に影響が出る。
  アイコンの刷新が必要なら独立したタスクとして切り出す
- **`src/app/globals.css`** — ゲーム画面も使う。CSS変数とアニメーションの定義がある。
  追加が必要なら自分のCSS Moduleの中に書く
- `src/components/game/` 配下 — レーンAの担当
- `src/app/game/` 配下
- `docs/PROJECT-STATUS.md`, `docs/ROADMAP.md` — 全レーン共通で編集禁止

## やること

1. 方向性の案を3つほど作り、ユーザーに選んでもらう。
   Netlify のプレビューで見比べられる形にするのが望ましい
2. 決まったら**共通のピクセルUIコンポーネントを先に作る**（ボタン・パネル・モーダル）。
   ページごとに個別CSSを書くと必ず破綻する
3. 各ページをそのコンポーネントで置き換える

## 参考にするもの

- `src/app/game/game.module.css` — 濃紺のピクセルHUD。`--navy-900: #0a2851` 系
- `src/app/style-lab/` — タイル見本ページ。氷色の下地に濃紺パネルという構成
- `src/app/style-lab/tile-masks/tile-masks.module.css` — 同じ構成の新しめの実装

## 完了条件

- ホーム・難易度選択・リザルト・ランキングがゲーム画面と同じ世界観になっている
- 共通コンポーネント経由で作られていて、ページごとの個別CSSに散っていない
- スマホの実機で横スクロールが発生しない

## 検証

1. `npm run lint` と `npm run build` が通る
2. Netlify のデプロイプレビューを実機で開き、全ページを一巡する
3. ゲーム画面の見た目が変わっていないことを確認する。
   変わっていたら共有ファイルに手を出している
