# Gradient Sweeper 仕様書

> このドキュメントはAI/開発者向けの詳細な技術仕様書です。

## 0. アプリ情報

| 項目 | 値 |
|------|-----|
| アプリ名 | Gradient Sweeper |
| アプリID | gradient-sweeper |
| アプリURL | https://game.hanage.app |
| ハブサイト | https://www.hanage.app |

## 1. ゴールと前提

- スマホ前提の色ヒント型マインスイーパーをPWAとして公開
- 収益化：広告導入前提（MVPは広告モックで実装）
- ランキング：オンラインで統合ランキング（匿名・Top100）

## 2. 技術スタック

### 2.1 フロント/アプリ
- Next.js + TypeScript
- App Router

### 2.2 ホスティング
- Netlify
- サブドメイン運用: game.hanage.app

### 2.3 ランキングDB
- Supabase（PostgreSQL）
- クライアントからの直接アクセス禁止、API経由に統一

### 2.4 将来のストア配布
- Android: Trusted Web Activity（TWA）で配布予定

## 3. 画面構成・遷移

| パス | 画面名 | 説明 |
|------|--------|------|
| `/` | Home | メイン画面 |
| `/ta` | Time Attack | 難易度選択 |
| `/game` | Game | ゲーム画面 |
| `/result` | Result | 最終結果 |
| `/ranking` | Ranking | ランキング表示 |

### 遷移フロー
```
Home → Endless開始 → Game
Home → Time Attack → /ta → 難易度選択 → Game
Home → Ranking
Game → Clear/Miss → Result
Result → Ranking or Home
```

## 4. 操作仕様（スマホ）

### 4.1 タップ
- セルを開く

### 4.2 フラグ（スワイプ）
- セルに触れてスワイプでフラグON/OFF
- 角度：全方向OK
- 判定仕様：
  - 開始点からの移動距離が `cellSize` 以上でスワイプ成立
  - スワイプ判定はタップより優先
  - 成立した瞬間に確定（指を離すのを待たない）
  - スワイプ成立時はセルを開かない

## 5. 基本ルール

- **勝利条件**: 爆弾以外のセルをすべて開く
- **連鎖**: 隣接爆弾総数（r+b）が0なら周辺を再帰的に開く
- **セル状態**: `hidden` | `revealed` | `flagged` | `exploded`

### 盤面サイズ
- 9x9 固定

### 爆弾配置
- 赤爆弾と青爆弾はランダム比率で配置

## 6. 色決定ルール

隣接8マスの爆弾数を `r`（赤）、`b`（青）とする。

```typescript
function getCellColor(r: number, b: number): [number, number, number] {
  // r==0 && b==0 → 白
  if (r === 0 && b === 0) return [255, 255, 255];
  
  const t = (r + b) / 8;
  
  // base（G=0固定）
  let base: [number, number, number];
  if (r >= b && r > 0) {
    base = [255, 0, Math.round(255 * (b / r))];
  } else {
    base = [Math.round(255 * (r / b)), 0, 255];
  }
  
  // color = (1-t)*255 + t*base
  return base.map((ch) => 
    Math.min(255, Math.max(0, Math.round((1 - t) * 255 + t * ch)))
  ) as [number, number, number];
}
```

## 7. ゲームモード

### 7A. Endless モード

| 項目 | 仕様 |
|------|------|
| 爆弾数 | 3開始、クリアごと+1、最大80 |
| クリア後 | 即次の面へ |
| タイマー | 開始から通算（ポーズ中停止） |
| 初期残機 | 3 |

#### ミス時の挙動
1. 残機 -1
2. 踏んだマスだけ未開に戻す
3. 盤面維持、タイマー継続
4. ミス数をカウント

#### 残機切れ時
- リワード広告視聴 → 残機3回復して続行
- あきらめる → 終了 → Result画面へ

#### ランキング
- 登録タイミング: 終了時（あきらめた時）
- ソート: スコア降順
- 表示: Top100

スコア計算:
```
score = (level × 20,000) - (time_seconds) - (miss_count × 500) - (revive_count × 1,000)
```

### 7B. Time Attack モード

| 難易度 | 爆弾数 |
|--------|--------|
| Easy | 10 |
| Mid | 20 |
| Hard | 30 |

| 項目 | 仕様 |
|------|------|
| タイマー | 開始〜クリア（ポーズ中停止） |
| 初期残機 | なし（残機概念を使わない） |
| 復活回数 | 最大2回まで（3ミスで終了） |

#### ミス時の挙動
1. ゲームオーバー画面表示
2. リワード広告で復活（最大2回）or あきらめる
3. 復活時：踏んだマスだけ未開に戻し、タイマー継続

#### ランキング
- 登録タイミング: クリア時のみ
- ソート: スコア降順（難易度別）
- 表示: 各難易度 Top100

スコア計算:
```
score = 1,000,000 - (time_ms ÷ 10) - (miss_count × 5,000) - (revive_count × 10,000)
```

## 8. ポーズ機能

- 盤面を隠す（オーバーレイ表示）
- タイマー停止
- 操作無効

## 9. Result画面

### 表示項目
- モード
- 難易度（TAのみ）
- タイム
- 到達面数（Endlessのみ）
- ミス数
- 復活回数
- スコア

### プレイヤー名入力
- 任意入力（最大50文字）
- LocalStorageに保存
- 未入力の場合は "Anonymous" として表示

### スコア計算式

#### エンドレスモード
```
score = (level × 20,000) - (time_ms ÷ 1,000) - (miss_count × 500) - (revive_count × 1,000)
```

- レベルが最重要
- 1レベル差 = 20,000点
- 1ミス = 500点ペナルティ（タイム500秒相当）
- 1復活 = 1,000点ペナルティ（タイム1,000秒相当）

#### タイムアタックモード
```
score = 1,000,000 - (time_ms ÷ 10) - (miss_count × 5,000) - (revive_count × 10,000)
```

- タイムが最重要
- 1ミス = 5,000点ペナルティ（タイム50秒相当）
- 1復活 = 10,000点ペナルティ（タイム100秒相当）

### アクション
- ランキング登録（名前入力 or スキップ）
- Rankingへ
- Homeへ

## 10. 多言語対応

- 対応言語: JP / EN
- 同一URLで切替
- 設定保存: localStorage
- ランキングは言語混在で同一リスト

## 11. UI/アセット方針

### MVP
- 絵文字を使用可
- ただしUIに直書きしない
- すべて `<Icon name="..." />` コンポーネント経由

### 将来
- Icon内部を絵文字→SVG/PNGに置換

### CSS変数
```css
:root {
  --cell-size: 36px;
  --icon-size: 24px;
  --gap: 2px;
  --radius: 4px;
}
```

## 12. ランキング仕様

### データモデル（Supabase）

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('endless', 'ta')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'mid', 'hard')),
  time_ms BIGINT NOT NULL,
  endless_level INT,
  miss_count INT NOT NULL DEFAULT 0,
  revive_count INT NOT NULL DEFAULT 0,
  player_name TEXT CHECK (length(player_name) <= 50),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_endless_score ON scores (score DESC) 
  WHERE mode = 'endless';
CREATE INDEX idx_scores_ta_score ON scores (difficulty, score DESC) 
  WHERE mode = 'ta';
```

### API

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/score | スコア登録 |
| GET | /api/leaderboard | Top100取得 |

### 不正対策
- サーバ側バリデーション（負数・異常値拒否）
- 簡易レート制限（IP単位）

## 13. 広告実装

### インターフェース
```typescript
interface RewardedProvider {
  init(config: unknown): void;
  isAvailable(): boolean;
  show(): Promise<'completed' | 'skipped' | 'failed'>;
}
```

### MVP
- `MockRewardedProvider`: 即 `completed` を返す

### 本番候補
- AppLixir
- AdPlayer.Pro

## 14. 環境変数

| 変数名 | 用途 | スコープ |
|--------|------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL | クライアント可 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase認証キー | サーバーのみ |

## 15. デプロイ

### Netlify
- GitHub連携 → build → deploy
- 独自ドメイン: game.hanage.app（CNAME）

### DNS設定（お名前.com）
- game.hanage.app → Netlifyサイト
- www.hanage.app → ハブ用Netlifyサイト
- hanage.app → www.hanage.app にリダイレクト

---

*最終更新: 2026-02-08*
