# E: Next.js 16 への移行

## 目的

Next.js 15 系のビルド／画像ツールチェーンにある脆弱性を解消する。

## 背景

`npm audit --omit=dev` が high 3件を報告している（`postcss` と `sharp`）。
これらは Next.js 15 が依存しているもので、**個別に上げられない**。
解消にはメジャーバージョンの更新が必要。

## 同時実行の制約

**このタスクは必ず単独で実施すること。**

- `package-lock.json` は21万行あり、コンフリクトすると手で直せない
- レーンD（テスト整備）も `package.json` を触るので同時不可
- **他のPRを全部マージし終えてから**着手する

着手前に、オープンなPRが残っていないことを確認すること。

## 触ってよいファイル

- `package.json`, `package-lock.json`
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `netlify.toml`（Node のバージョン要件が変わる場合）
- `.nvmrc`
- 移行に伴って修正が必要になった実装コード（**移行に必要な範囲のみ**）

## 触ってはいけないファイル

- 移行と無関係な実装の改善。ついでのリファクタリングをしない。
  移行だけでも差分が大きくなるので、混ぜるとレビューが不可能になる
- `docs/PROJECT-STATUS.md`, `docs/ROADMAP.md` — 全レーン共通で編集禁止

## やること

1. Next.js 16 の移行ガイドを確認し、破壊的変更を洗い出す
2. Node のバージョン要件を確認する。上がるなら `.nvmrc` / `package.json` の
   `engines` / `netlify.toml` / `.github/workflows/ci.yml` をすべて揃える。
   **1箇所でも漏れると本番だけ壊れる**
3. 依存を更新し、型エラーとビルドエラーを潰す
4. `npm audit --omit=dev` で high が解消されたことを確認する

## 特に確認すべき箇所

- **App Router の挙動** — 全ページが App Router 上にある
- **`next/image`** — 覆われた雪タイルと下絵の描画に使っている。
  `unoptimized` 指定の扱いが変わっていないか
- **`useSearchParams`** — `/game` と `/result` が使っており、`Suspense` で包んである
- **静的生成** — `/style-lab/color-map` は `fs.readdirSync` をビルド時に実行している。
  ここが動かなくなると検証ページが壊れる
- **Netlify の `@netlify/plugin-nextjs`** — Next.js 16 に対応しているか。
  未対応ならこのタスクは待つ判断もありうる

## 完了条件

- `npm audit --omit=dev` の high が0件
- `npm run lint`, `npm run build`, `npm test`（あれば）がすべて通る
- Netlify のデプロイプレビューが正常にビルドされる
- ゲームが最後まで通しでプレイできる

## 検証

**このタスクは表示確認だけでは不十分。** 通しで動作確認すること。

1. Netlify のデプロイプレビューで Endless を数レベル進める
2. Time Attack を1面クリアしてリザルトまで到達する
3. ランキング画面が表示される
4. `/style-lab`, `/style-lab/color-map`, `/style-lab/tile-masks` が壊れていない
5. `npm audit --omit=dev` の結果をPR説明に貼る
