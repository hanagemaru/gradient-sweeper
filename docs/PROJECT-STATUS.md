# Project status

Last updated: 2026-08-22

> このファイルは**並行作業が無いときにだけ**更新する（AGENTS.md「Working in parallel」）。
> 作業中に共有したいことは PR 説明かタスク仕様に書くこと。

## Current baseline

- 画面は**全ページが `PixelScene` の固定キャンバス**に載っている（`/`・`/ta`・`/game`・
  `/ranking`・`/result`、およびポーズ／ゲームオーバー／レベルクリアのオーバーレイ）。
  ホームとゲーム画面で意匠・フォント・配色変数が共通になった。
- **キャンバスは 390 x 550 px**。`transform: scale(min(100vw/390, 100svh/550, 2.2))` で
  画面に収まるだけ拡大縮小し、あまりは黒で塗る（レターボックス）。
  高さ 550 の根拠は `src/components/ui/pixel-ui.module.css` の冒頭コメントと
  `docs/tasks/I-canvas-fit.md` にある。**勝手に増やすと iPhone SE で左右に黒帯が戻る。**
- 背景は `crystals-v2` / `cell-autotile-v2` の PNG を固定座標に置いたもの。
  ホームは `src/lib/background-world.ts`（`scripts/generate-background-world.mjs` の生成物・
  手編集禁止）、ゲーム画面は `src/lib/game-scenery.ts`（手で置いた固定リスト）。
- 承認済みの雪・氷アセットは `public/assets/frostbound/tiles-v5/`。
- `/style-lab` は視覚的なリファレンスとして残っている。子ルート `/style-lab/color-map` は
  全45通りの隣接状態と実タイルの対応を描画する。本番の `getIceAsset()`
  （`src/lib/tile-assets.ts`）を直接呼ぶので、ゲームとずれない。
- 未開封セルは `tiles-v5` の雪・旗・角の下敷き・落ち影レイヤーを使う。
- **開封済みセルは状態ごとの PNG ではない。** パレット色（`src/lib/ice-colors.ts`）の上に
  共有のグレースケール下絵を `mix-blend-mode: overlay` で合成している
  （`src/lib/tile-masks.ts`）。45状態すべてに別の色が付き、下絵は5枚で足りる。
  `/style-lab/tile-masks` で比較できる。
- 各マスクは**平均が中間グレー**になるよう作ってあり、`overlay` がタイルの明度をずらさない。
  パレットは**爆弾数を明度で表す**ので、この性質は load-bearing。
  `overlay` を `multiply` に置き換えないこと。

## Tile rules

- セルの占有: 36 x 36 px、グリッドの隙間なし。
- 開封済みの氷タイル: 36 x 36 px。
- 未開封の雪タイル: 36 x 38 px。セルより 2px 上に置き、下辺を揃える。
- 雪の落ち影: 左右対称・下方向に 3px・半透明の multiply。CSS であり PNG には焼いていない。
- 旗のオーバーレイ: 18 x 22 px（`left: 12px; top: 5px`）。
- 赤青が混在する隣接は紫の氷。どちらかに大きく偏る場合は赤または青の氷。

## Known limitations

- **Next.js 15 系の脆弱性が未解消。** `npm audit --omit=dev` が high 3件を報告する
  （`postcss` のパストラバーサル、`sharp` が引き継ぐ libvips の CVE）。個別には上げられず、
  Next.js 16 へのメジャー更新が必要。→ `docs/tasks/E-nextjs16.md`
- **連鎖開放（BFS）のテストが薄い。** `src/lib/game-logic.test.ts` に 32件あるが、
  その大半は初手保証（レーンF）のもの。`revealCell` は3件（全開・1マス・noop）だけで、
  壁で区切られた領域・盤面の端・旗が絡む連鎖・爆弾を踏んだときは未カバー。
  `resetExplodedCell` はテスト0件。→ `docs/tasks/D-tests.md` の優先度1
- **盤面の爆弾表示が絵文字（🔴 / 🔵）のまま**（`src/components/game/Cell.tsx`）。
  世界観から浮いているが、差し替えには新規アセットが要る。
- `src/components/Icon.tsx` の絵文字プレースホルダが残っている。参照元は `Cell.tsx` と、
  現在どこからも描画されていない `Timer.tsx` / `Lives.tsx` / `BombCounter.tsx`。
- **iPhone SE の Safari では左右に 12px ずつ黒帯が残る。**「全機種で黒帯0」という
  設計意図の未達。実効 svh が 495（推定していた 553 より 58px 少ない）ため。
  詳細と閉じる場合の見積もりは `docs/tasks/I-canvas-fit.md`。
- 盤面のドット絵が非整数倍で拡大縮小される。固定キャンバス方式のトレードオフとして許容。

### 解消済み（以前ここに書かれていたもの）

- ~~自動テストが存在しない~~ → 32件が `src/lib/game-logic.test.ts` にある。CI でも走る。
- ~~Endless のスコアがクライアント申告のまま~~ → `src/lib/score-validation.ts` の
  `validateScoreSubmission` がサーバー側で検証する（レーンC / PR #6）。
- ~~Supabase の RLS が未設定~~ → 2026-08-18 に本番プロジェクトで有効化済み
  （`docs/DEPLOYMENT.md`）。
- ~~glacier のビジュアルが `/game` だけ~~ → 全ページに適用済み。

## Known follow-up work

着手順と依存関係は `docs/ROADMAP.md`、レーンの分け方は `docs/tasks/README.md` を参照。

1. **Next.js 16 移行**（`docs/tasks/E-nextjs16.md`）。セキュリティ項目なので優先度が高い。
   `package-lock.json` が巨大なコンフリクトになるため**単独セッションで実施すること。**
2. **連鎖開放のテスト**（`docs/tasks/D-tests.md` の優先度1）。
3. 爆弾表示のアセット差し替え。

## Development and deployment

- Runtime: Node.js 20
- Install: `npm ci`
- Verify: `npm run lint` / `npm run test` / `npm run build`
- Production: Netlify
- Database: Supabase。本番の secret は GitHub に置いていない。
- CI (`.github/workflows/ci.yml`) は `main`・`codex/**`・`claude/**`・`ui-**` への push と
  すべての PR で **lint → test → build** を走らせる。
