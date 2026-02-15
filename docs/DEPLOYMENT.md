# デプロイ・DB設定ガイド

このドキュメントでは、Gradient Sweeperのデプロイ手順とデータベース設定を説明します。

## 目次

1. [Netlifyへのデプロイ](#netlifyへのデプロイ)
2. [Supabaseの設定](#supabaseの設定)
3. [DBスキーマ・マイグレーション](#dbスキーママイグレーション)
4. [環境変数の設定](#環境変数の設定)
5. [独自ドメインの設定](#独自ドメインの設定)

---

## Netlifyへのデプロイ

### 前提条件

- GitHubアカウント
- Netlifyアカウント（無料プランで十分）
- このリポジトリがGitHubにpushされていること

### デプロイ手順

#### 1. Netlifyにログイン

https://app.netlify.com/ にアクセスしてログイン

#### 2. 新規サイトの作成

1. **Add new site** → **Import an existing project** をクリック
2. **GitHub** を選択（初回は連携許可が必要）
3. リポジトリ `gradient-sweeper` を選択

#### 3. ビルド設定

以下の設定が自動で入力されます（`netlify.toml` に記載済み）：

- **Base directory**: （空欄）
- **Build command**: `npm run build`
- **Publish directory**: `.next`

確認して **Deploy site** をクリック

#### 4. デプロイ完了

数分でデプロイが完了し、`https://xxxxxx.netlify.app` のURLが発行されます。

### 継続的デプロイ

Gitの `main` ブランチにpushすると、Netlifyが自動で再デプロイします。

---

## Supabaseの設定

ランキング機能を本格運用する場合はSupabaseを設定します。

### 1. Supabaseプロジェクトの作成

1. https://supabase.com/ でプロジェクトを作成
2. Database Password を設定

### 2. テーブルの作成

下記「DBスキーマ・マイグレーション」セクションのSQLを実行してください。

### 3. Row Level Security (RLS) の設定

```sql
-- RLSを有効化
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Allow public read access"
ON scores FOR SELECT
USING (true);

-- 全員が挿入可能（API経由のみ）
CREATE POLICY "Allow public insert access"
ON scores FOR INSERT
WITH CHECK (true);
```

---

## DBスキーマ・マイグレーション

### 現在のスキーマ（v2）

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('endless', 'ta')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'mid', 'hard')),
  time_ms BIGINT,                                    -- TAの場合のみ使用
  penalty_ms BIGINT DEFAULT 0,                       -- TA復活ペナルティ用
  endless_level INT,
  miss_count INT NOT NULL DEFAULT 0,
  revive_count INT NOT NULL DEFAULT 0,
  player_name TEXT CHECK (length(player_name) <= 50),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Endless: スコア降順（高スコアが上位）
CREATE INDEX idx_scores_endless_score
ON scores (score DESC)
WHERE mode = 'endless';

-- TA: スコア昇順（scoreに最終タイム(ms)を格納、短タイムが上位）
CREATE INDEX idx_scores_ta_score
ON scores (difficulty, score ASC)
WHERE mode = 'ta';
```

### scoreカラムの意味

- **Endless**: クライアントで算出したリアルタイム加算スコア（セル開放 + スピード/クリア/パーフェクトボーナス - ミスペナルティ）
- **TA**: 最終タイム(ms) = `time_ms` + `penalty_ms`（小さいほど上位。インデックス昇順）

### 新規セットアップ

初めてSupabaseを設定する場合は、上記「現在のスキーマ（v2）」のSQLをそのまま実行してください。

### 既存環境のマイグレーション（v1→v2）

v1スキーマからのアップグレードが必要な場合：

```sql
-- 1. 既存データを全削除（スコア計算方式が変更されたため）
DELETE FROM scores;

-- 2. カラム追加
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS player_name TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS revive_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS penalty_ms BIGINT DEFAULT 0;

-- 3. player_nameの長さ制約を追加
ALTER TABLE scores
ADD CONSTRAINT player_name_length CHECK (length(player_name) <= 50);

-- 4. time_ms を NULL 許可に変更（Endlessではタイム不要）
ALTER TABLE scores
ALTER COLUMN time_ms DROP NOT NULL;

-- 5. インデックス更新
DROP INDEX IF EXISTS idx_scores_endless;
DROP INDEX IF EXISTS idx_scores_ta;
DROP INDEX IF EXISTS idx_scores_ta_score;

CREATE INDEX IF NOT EXISTS idx_scores_endless_score
ON scores (score DESC)
WHERE mode = 'endless';

CREATE INDEX idx_scores_ta_score
ON scores (difficulty, score ASC)
WHERE mode = 'ta';
```

### 検証

マイグレーション後、以下のクエリで確認：

```sql
-- カラムが正しいか確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'scores'
ORDER BY ordinal_position;

-- インデックスが作成されたか確認
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'scores';
```

### ロールバック

もし問題が発生した場合：

```sql
ALTER TABLE scores
DROP COLUMN IF EXISTS player_name,
DROP COLUMN IF EXISTS score,
DROP COLUMN IF EXISTS revive_count,
DROP COLUMN IF EXISTS penalty_ms;

DROP INDEX IF EXISTS idx_scores_endless_score;
DROP INDEX IF EXISTS idx_scores_ta_score;

CREATE INDEX idx_scores_endless ON scores (endless_level DESC, time_ms ASC)
WHERE mode = 'endless';
CREATE INDEX idx_scores_ta ON scores (difficulty, time_ms ASC)
WHERE mode = 'ta';
```

---

## 環境変数の設定

### Supabase使用時（本番運用）

Netlify Site settings → **Environment variables** に以下を追加：

| キー | 値 | 説明 |
|------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | SupabaseのプロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Service Role Key（秘密鍵） |

**重要**: `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドでのみ使用され、クライアントには送信されません。

### Supabase未設定の場合

環境変数を設定しなくても、モックデータで動作します。

---

## 独自ドメインの設定

### 1. Netlifyでドメインを追加

1. Site settings → **Domain management**
2. **Add a domain** をクリック
3. 所有しているドメイン名を入力（例: `sweeper.hanage.app`）

### 2. DNS設定

ドメインレジストラ（お名前.comなど）で以下のレコードを追加：

#### サブドメインの場合（例: sweeper.hanage.app）
```
CNAME    sweeper    silly-dodol-4def9c.netlify.app
```

#### 所有権確認用TXTレコード（初回のみ）
```
TXT    subdomain-owner-verification    [Netlifyが指定する値]
```

#### ルートドメインの場合（例: example.com）
```
A    @    75.2.60.5
```

### 3. HTTPS証明書

Netlifyが自動でLet's EncryptのSSL証明書を発行します（数分～数時間）。

---

## トラブルシューティング

### ビルドが失敗する

1. Netlifyの **Deploy logs** を確認
2. エラーメッセージの最後の数行をチェック
3. ローカルで `npm run build` が通るか確認

### 環境変数が反映されない

- Netlifyで環境変数を追加/変更した後は **再デプロイが必要**
- Deploysタブ → **Trigger deploy** → **Clear cache and deploy**

### ランキングが表示されない

- Supabaseの設定が正しいか確認
- Network タブでAPIレスポンスを確認（`/api/leaderboard`）
- モックモードの場合はテストデータが表示されます

### DBマイグレーションでエラー

#### カラムがすでに存在する
`IF NOT EXISTS` を使用しているため、通常は安全に再実行可能。

#### 制約違反
```sql
-- 制約をいったん削除
ALTER TABLE scores DROP CONSTRAINT IF EXISTS player_name_length;
-- データを修正
UPDATE scores SET player_name = LEFT(player_name, 50) WHERE length(player_name) > 50;
-- 制約を再追加
ALTER TABLE scores ADD CONSTRAINT player_name_length CHECK (length(player_name) <= 50);
```

---

## 次のステップ

- [ ] ランキングDB本番化（Supabase設定）
- [ ] UI本番作り込み（アセット適用）
- [ ] 広告適用
- [ ] ハブサイト（hanage.app）の構築
- [ ] Service Workerの実装（オフライン対応）

---

*最終更新: 2026-02-15*
