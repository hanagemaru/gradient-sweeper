# H: リザルト画面をゲーム画面の上にオーバーレイする

## 目的

`/result`（リザルト画面）は本来ゲーム画面の続きとして、盤面の上にオーバーレイ
表示されるべき。現状は完全に独立したページ遷移になっており、PR #10 で
追加した背景ワールド（`PixelScene` の氷原の総柄）を他の3ページと同じように
使ってしまっている。これがゲーム体験として正しいか、正しくないなら
どう直すかを検討し、実装する。

## 背景

PR #10（レーンB）で `/`・`/ta`・`/result`・`/ranking` の4ページを
固定キャンバス＋レターボックス方式の共通 `PixelScene` へ揃えた。
`/result` もその1つとして扱ったが、実装後にユーザーから
「リザルト画面はゲーム画面の上にオーバーレイされるべきなので、
今回の背景は使わないのでは」という指摘があり、スコープ外として
このタスクへ切り出した。

### 現状の遷移

- `src/app/game/page.tsx` の `handleGiveUp` / `handleFinish` が
  `router.push(`/result?${params}`)` で完全に別ページへ遷移する。
  盤面はアンマウントされ、`/result` が独自の `<PixelScene>`（氷原の背景）を
  最初から描き直す。
- 一方でゲームオーバー・クリアの直後は、`GameOverModal` /
  `ClearedModal`（`src/components/game/`）という**盤面の上に重なるモーダル**が
  既に一度表示されている。そこから「結果を見る」的な操作で `/result` へ
  遷移する流れになっている（正確な導線は `src/app/game/page.tsx` を読んで
  確認すること）。
- `/result` は `/ranking` への中継点でもある（スコア送信 →
  `/ranking?mode=...` へ遷移）。単純にモーダル化すると、この後続遷移も
  含めて設計し直す必要がある。

## 検討してほしいこと

1. `/result` は本当にゲーム盤面の上へオーバーレイすべきか。
   ブラウザの戻る/進む、直接URLアクセス、ソーシャル共有などで
   `/result` に単独で来るケースがないかも確認する。
2. オーバーレイにする場合、実現方法の候補:
   - `GameOverModal`/`ClearedModal` のように、ゲーム画面側で
     モーダルとして描画する（ページ遷移をやめる）
   - Next.js のインターセプトルート（parallel routes / intercepting routes）で
     `/game` の上に `/result` をモーダル的に重ねつつ、直接アクセス時は
     フルページとして表示する
   - `/result` はページのまま、背景だけ「ゲーム盤面のスクリーンショット」や
     「ゲーム画面と同じグレイシャーHUD」に差し替える
3. オーバーレイにしない場合（現状の独立ページのままにする場合）でも、
   少なくとも今回追加した氷原の背景ワールド（`PixelScene` の `.backdrop`）を
   `/result` にも使い続けてよいのかは判断が必要。ゲーム画面の
   `game.module.css` の世界観（濃紺HUD）に寄せる案もありうる。

## 触ってよいファイル

- `src/app/result/`
- `src/app/game/page.tsx`（結果画面への遷移まわりのみ。盤面ロジック本体は触らない）
- `src/components/ui/`（`PixelScene` にオプションを足す程度の変更なら可）

## 触ってはいけないファイル

- `src/components/game/` 配下（`GameOverModal` / `ClearedModal` の中身を
  含む。参考にはするが、盤面描画ロジックには触れない）
- `src/components/Icon.tsx`
- `src/app/globals.css`
- `docs/PROJECT-STATUS.md`, `docs/ROADMAP.md`

## 参考にするもの

- `docs/tasks/B-pixel-ui.md` — 固定キャンバス＋レターボックス方式の仕様。
  「固定キャンバス＋レターボックスへの転換」の節に実装上の注意点がある。
- `src/components/ui/pixel-ui.module.css` の `.stage`/`.scene`/`.scroll`
- `src/components/game/GameOverModal.tsx` / `ClearedModal.tsx` — 既存の
  盤面上オーバーレイの実装例

## 完了条件

- リザルト画面の見せ方について結論が出て、実装されている
- ゲーム画面（`/game`）の盤面描画・進行ロジックに影響がない
- `npm run lint` と `npm run build` が通る
