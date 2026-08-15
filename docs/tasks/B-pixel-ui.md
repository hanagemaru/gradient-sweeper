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
- 最終背景は、画面より大きい1つの背景ワールドを作り、スマホ・タブレット・PCでは
  カメラのように表示範囲を切り替える。`background-size: cover` は使わない。
- 背景ワールドの全体確認PNGと、各画面比率の切り取り確認画像も用意する。

現在のローカル作業で作られた BSP・5シード背景比較は不採用の実験であり、
PR #10 の引き継ぎチェックポイントには含めない。

### 背景ワールド実装時に確定したこと

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
