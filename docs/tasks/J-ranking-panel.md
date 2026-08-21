# J: ランキングをパネルのオーバーレイ表示にする

## 目的

ランキングを独立ページへの遷移ではなく、**いま見ている画面の上に重なるパネル**として
表示する。ランキングには起点が2つあるが、どちらから開いても
パネルの見た目・寸法・位置・拡大率が完全に一致している状態にする。

- ホーム画面の「ランキング」ボタン → ホームの背景の上に重ねる
- ゲーム終了後、リザルトでスコアを登録したあと → 盤面の上に重ねる

## 背景

レーンH（PR #11）でリザルトが `/game` 上のオーバーレイになった。しかしスコア登録後は
まだ `router.push("/ranking?mode=...")` でページ遷移しており、氷原背景の
`/ranking` ページへ飛んでしまう。ゲームの続きを見ているつもりが、
別世界のページに放り出される。

### 調査済みの事実

- ランキングの中身は `src/app/ranking/page.tsx` にべた書き。
  `PixelScene width="wide"` + `PixelPanel title="RANKING"` + タブ + `PixelTable` で、
  `/api/leaderboard` を fetch している。サーバー側の依存は無く、
  クライアントから叩くだけなのでオーバーレイでもそのまま動く。
- ゲーム終了後にランキングへ飛ばしているのは
  `src/app/result/useResultSubmission.ts` の `handleSubmit` 末尾。
- `/game`（`src/app/game/page.tsx`）は `PixelScene` を一切使っていない通常フロー。

### 実装上の肝（ここを外すと見た目が壊れる）

パネルの配色とフォントを決めている CSS カスタムプロパティ
（`--navy-900` / `--cyan` / `--jp-font` など）と `font-family` は
`pixel-ui.module.css` の `.scene` に載っている。`PixelPanel` を `.scene` の外に
素で置くと変数が全部未定義になり、パネルが無地の箱になる。

また `/game` の生ピクセルの上に直接パネルを置くと、`.scene` の
`transform: scale()` が掛からないぶん、ホーム経由と大きさがズレる。
**両方の起点で `.scene` を通すことが、見た目を一致させる条件**になっている。

## 方針

`PixelScene` に「背景なしオーバーレイ」モード（`overlay` prop）を足す。

- `PixelBackdrop` を描かない
- `.stage` を黒いレターボックスではなく、ビューポート全面の半透明の暗幕
  （リザルトのモーダルと同じ `rgba(6, 26, 55, 0.82)` 相当）にし、z-index を上げる
- `.scene` の固定キャンバス（390x670）と `transform: scale()` はそのまま使う

こうするとホーム経由でもゲーム経由でも、キャンバスの倍率が同じように掛かるので
パネルの寸法・位置・拡大率が完全に一致する。

あわせてランキングの中身を `RankingPanel` として切り出し、
`/ranking` ページとオーバーレイの両方から使う。

### 決定事項（ユーザー確認済み）

1. **ホーム側もオーバーレイにする。** `/ranking` ページ自体は直接URLアクセス用に残す。
   遷移が無くなるので、後続レーンで入れる予定の雪アニメーションが
   remount でリセットされる問題が、この経路では起きなくなる。
2. **背後には半透明の暗幕をかける。** 開封済みマスは45色でコントラストが強く、
   暗幕なしではパネル外周の視認性が落ちるため。
3. **ゲーム経由で見たあとの「戻る」はホーム `/` へ。** 現在の `/ranking` ページの
   「戻る」と同じ行き先。

## 触ってよいファイル

- `src/components/ui/PixelUI.tsx`（`PixelScene` の `overlay` モード追加のみ）
- `src/components/ui/pixel-ui.module.css`（オーバーレイ用のクラス追加のみ）
- `src/app/ranking/page.tsx`
- `src/app/ranking/RankingPanel.tsx`（新規）
- `src/app/ranking/RankingOverlay.tsx`（新規）
- `src/app/page.tsx`（ホームのランキングボタン）
- `src/app/game/page.tsx`（ランキングオーバーレイの表示分岐のみ）
- `src/app/result/useResultSubmission.ts`（`onSubmitted` コールバック追加のみ）
- `docs/tasks/J-ranking-panel.md`・`docs/tasks/README.md`

## 触ってはいけないファイル

- `docs/PROJECT-STATUS.md`・`docs/ROADMAP.md`（並行作業中は編集しない）
- `package.json`・`package-lock.json`（依存は追加しない）
- `src/components/ui/Modal.tsx`・`src/components/game/` 配下
- `src/app/result/page.tsx`・`src/app/result/GameResultOverlay.tsx`
  （レーンHの成果物。`useResultSubmission` の呼び出し側として読むだけ）
- 盤面の描画まわり（`src/lib/ice-colors.ts`・`src/lib/tile-masks.ts`・`Board`・`Cell`）

## やること

1. `PixelScene` に `overlay` prop を足す。`overlay` のときは背景ワールドを描かず、
   `.stage` を半透明の暗幕にして z-index を上げる。キャンバスと transform は共通のまま。
2. `/ranking` の中身を `RankingPanel` へ切り出す。`PixelScene` は含めない。
   初期モード・初期難易度と「戻る」の挙動を props で受ける。
3. `RankingPanel` を `PixelScene overlay width="wide"` で包む `RankingOverlay` を作り、
   ホームとゲームの両方から使う。
4. `/ranking` ページは `RankingPanel` を従来どおり `PixelScene width="wide"` で包む。
   直接URLアクセス用のフルページ版として残す。
5. ホームの「ランキング」ボタンをリンクから、オーバーレイを開くボタンへ変える。
6. `useResultSubmission` に `onSubmitted` コールバックを足す。渡されなければ
   従来どおり `/ranking` へ遷移し、渡された場合はそれを呼ぶだけにする。
   `/result` ページは従来どおり遷移、`/game` はオーバーレイ表示に分岐させる。

## 完了条件

- ホームの「ランキング」でページ遷移が起きず、ホームの背景の上にパネルが出る
- ゲーム終了 → スコア登録の後、盤面の上に同じパネルが出る
- 上記2つでパネルの寸法・位置・拡大率が一致している
- ゲーム経由の「戻る」でホームへ戻る
- `/ranking` への直接URLアクセスが従来どおり動く
- `npm run lint` と `npm run build` が通る

## 検証

- `npm run lint` / `npm run build`
- 本番ビルドを起動し、ホーム経由とゲーム経由の両方でパネルを開いて、
  スクリーンショットを重ねて寸法が一致することを確認する
- キャンバス高さ（670px）を超える件数のときにパネル内がスクロールし、
  暗幕とキャンバスが動かないことを確認する
- `/ranking?mode=ta&difficulty=hard` への直接アクセスで初期タブが復元されること

## 次のレーンへの申し送り

雪のアニメーション（ホーム背景）は別レーンで、このPRのマージ後に行う。
`PixelUI.tsx` と `pixel-ui.module.css` を同じく触るため、同時に走らせると衝突する。

雪を実装するときの注意を2つ残しておく。

- 雪を `src/app/layout.tsx` へ引き上げてはいけない。`.backdrop` は `.scene` の
  `transform: scale()` を containing block にしてキャンバスに閉じ込められている。
  layout に出すと transform の外になり、黒いレターボックス帯の上にも雪が降る。
- それでも `/game` や `/ta` との行き来ではページが remount され、
  `animation-delay` で撒いた雪片が一斉に開始位置へ戻る。気になる場合は、
  モジュールスコープに保持した開始時刻から `animation-delay: -(経過 % 周期)` を
  算出して mount 時に渡すと、続きから再生できる（モジュールスコープの値は
  クライアント遷移をまたいで生き残る）。
