# アーキテクチャ詳細

## システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (PWA)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Next.js App                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │
│  │  │  Home   │ │  Game   │ │ Result  │ │ Ranking  │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────┘  │   │
│  │                     │                      │        │   │
│  │              ┌──────┴──────┐              │        │   │
│  │              │   Hooks     │              │        │   │
│  │              │ useGame     │              │        │   │
│  │              │ useTimer    │              │        │   │
│  │              │ useSwipe    │              │        │   │
│  │              └─────────────┘              │        │   │
│  └─────────────────────┬─────────────────────┘        │   │
│                        │                              │   │
└────────────────────────┼──────────────────────────────┘   │
                         │                                   │
                         ▼                                   │
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   API Routes                         │   │
│  │  POST /api/score          GET /api/leaderboard      │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   PostgreSQL                         │   │
│  │                   scores table                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## フォルダ構造

```
gradient-sweeper/
├── docs/                           # ドキュメント
│   ├── SPEC.md                     # 仕様書
│   ├── PROGRESS.md                 # 進捗管理
│   ├── DEPLOYMENT.md               # デプロイ・DB設定ガイド
│   ├── USER-GUIDE.md               # ユーザー向けガイド
│   └── technical/                  # 技術ドキュメント
│       ├── ARCHITECTURE.md         # このファイル
│       ├── API.md                  # API仕様
│       └── GAME-LOGIC.md           # ゲームロジック
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── globals.css             # グローバルCSS・CSS変数
│   │   ├── layout.tsx              # ルートレイアウト
│   │   ├── page.tsx                # Home (/)
│   │   ├── ta/
│   │   │   └── page.tsx            # Time Attack選択
│   │   ├── game/
│   │   │   └── page.tsx            # Game画面
│   │   ├── result/
│   │   │   └── page.tsx            # Result画面
│   │   ├── ranking/
│   │   │   └── page.tsx            # Ranking画面
│   │   └── api/
│   │       ├── score/
│   │       │   └── route.ts        # スコア登録API
│   │       └── leaderboard/
│   │           └── route.ts        # ランキング取得API
│   │
│   ├── components/
│   │   ├── ui/                     # 汎用UIコンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── LanguageToggle.tsx  # 言語切替ボタン
│   │   ├── game/                   # ゲーム関連コンポーネント
│   │   │   ├── Board.tsx           # 盤面
│   │   │   ├── Cell.tsx            # セル
│   │   │   ├── Timer.tsx           # タイマー表示
│   │   │   ├── Lives.tsx           # 残機表示
│   │   │   ├── PauseOverlay.tsx    # ポーズオーバーレイ
│   │   │   ├── BombCounter.tsx     # 爆弾カウンター
│   │   │   ├── ClearedModal.tsx    # クリア演出モーダル
│   │   │   ├── GameOverModal.tsx   # ゲームオーバーモーダル
│   │   │   ├── MilestoneEffect.tsx # マイルストーンエフェクト
│   │   │   ├── ScoreDisplay.tsx    # スコア表示
│   │   │   └── ScorePopup.tsx      # スコアポップアップ
│   │   └── Icon.tsx                # アイコンコンポーネント
│   │
│   ├── hooks/
│   │   ├── useGame.ts              # ゲーム状態管理
│   │   ├── useTimer.ts             # タイマー
│   │   ├── useSwipe.ts             # スワイプ検出
│   │   └── useScorePopup.ts        # スコアポップアップ制御
│   │
│   ├── lib/
│   │   ├── game-logic.ts           # ゲームロジック
│   │   ├── supabase.ts             # Supabaseクライアント
│   │   ├── rewarded-provider.ts    # 広告プロバイダ
│   │   └── score.ts                # スコアユーティリティ
│   │
│   ├── i18n/
│   │   ├── index.ts                # 多言語エントリ
│   │   ├── ja.ts                   # 日本語
│   │   ├── en.ts                   # 英語
│   │   ├── LanguageContext.tsx      # 言語コンテキスト
│   │   └── useI18n.ts              # 多言語フック
│   │
│   └── types/
│       └── game.ts                 # 型定義
│
├── public/
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # PWAアイコン
│
├── .env.local                      # 環境変数（ローカル）
├── netlify.toml                    # Netlify設定
├── next.config.ts                  # Next.js設定
├── tailwind.config.ts              # Tailwind設定
├── tsconfig.json                   # TypeScript設定
└── package.json
```

## データフロー

### ゲームプレイ時

```
1. ユーザー操作
   ↓
2. useSwipe / タップ検出
   ↓
3. useGame.dispatch(action)
   ↓
4. ゲーム状態更新 (reducer)
   ↓
5. UI再レンダリング
```

### スコア登録時

```
1. ゲーム終了
   ↓
2. Result画面表示
   ↓
3. POST /api/score (自動)
   ↓
4. サーバーバリデーション
   ↓
5. Supabase INSERT
```

### ランキング取得時

```
1. Ranking画面表示
   ↓
2. GET /api/leaderboard
   ↓
3. Supabase SELECT (Top100)
   ↓
4. レスポンス返却
   ↓
5. 一覧表示
```

## 状態管理

### グローバル状態（Context）

- **LanguageContext**: 現在の言語 (ja/en)
- **GameContext**: ゲーム状態（オプション）

### ローカル状態（useState/useReducer）

- ゲーム状態: `useGame` フック内で管理
- タイマー: `useTimer` フック内で管理

### 永続化

| データ | 保存先 |
|--------|--------|
| 言語設定 | localStorage |
| スコア | Supabase |

## コンポーネント設計方針

1. **Presentational / Container分離**
   - UI表示のみのコンポーネントとロジックを持つコンポーネントを分離

2. **Icon経由のアセット管理**
   - すべてのアイコン/絵文字は `<Icon name="..." />` 経由
   - 将来的なSVG/PNG置換を容易に

3. **CSS変数によるサイズ統一**
   - `--cell-size`, `--icon-size`, `--gap`, `--radius`

---

*最終更新: 2026-02-15*
