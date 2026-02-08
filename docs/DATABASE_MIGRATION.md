# データベーススキーマ更新ガイド

## 概要

このドキュメントは、スコアリングシステムとプレイヤー名機能の実装に伴うデータベーススキーマの変更手順を説明します。

## 変更内容

### 追加カラム

`scores` テーブルに以下のカラムを追加します：

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| `player_name` | TEXT | YES | NULL | プレイヤー名（最大50文字） |
| `score` | INTEGER | NO | 0 | 計算されたスコア |
| `revive_count` | INTEGER | NO | 0 | 復活回数 |

## マイグレーション手順

### Supabaseでの手順

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 新しいクエリを作成し、以下のSQLを実行：

```sql
-- カラムを追加
ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS player_name TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS revive_count INTEGER NOT NULL DEFAULT 0;

-- player_nameの長さ制約を追加
ALTER TABLE scores 
ADD CONSTRAINT player_name_length CHECK (length(player_name) <= 50);

-- スコアでソートするためのインデックスを追加
CREATE INDEX IF NOT EXISTS idx_scores_endless_score 
ON scores (score DESC) 
WHERE mode = 'endless';

CREATE INDEX IF NOT EXISTS idx_scores_ta_score 
ON scores (difficulty, score DESC) 
WHERE mode = 'ta';

-- 既存のインデックスを削除（スコアベースのソートに変更したため不要）
DROP INDEX IF EXISTS idx_scores_endless;
DROP INDEX IF EXISTS idx_scores_ta;
```

### 既存データの移行

既存のスコアデータがある場合、スコアを再計算する必要があります：

```sql
-- エンドレスモードのスコアを計算
UPDATE scores 
SET score = (endless_level * 20000) - (time_ms / 1000) - (miss_count * 500) - (COALESCE(revive_count, 0) * 1000)
WHERE mode = 'endless';

-- タイムアタックモードのスコアを計算
UPDATE scores 
SET score = 1000000 - (time_ms / 10) - (miss_count * 5000) - (COALESCE(revive_count, 0) * 10000)
WHERE mode = 'ta';

-- 負のスコアを0にクリップ
UPDATE scores 
SET score = 0 
WHERE score < 0;
```

## 更新後のスキーマ

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

-- インデックス
CREATE INDEX idx_scores_endless_score 
ON scores (score DESC) 
WHERE mode = 'endless';

CREATE INDEX idx_scores_ta_score 
ON scores (difficulty, score DESC) 
WHERE mode = 'ta';
```

## スコア計算式

### エンドレスモード
```
score = (level × 20,000) - (time_ms ÷ 1,000) - (miss_count × 500) - (revive_count × 1,000)
```

### タイムアタックモード
```
score = 1,000,000 - (time_ms ÷ 10) - (miss_count × 5,000) - (revive_count × 10,000)
```

## Row Level Security (RLS)

既存のRLSポリシーがある場合、新しいカラムにも適用されるか確認してください。

```sql
-- 挿入ポリシー（例）
CREATE POLICY "Anyone can insert scores"
ON scores FOR INSERT
TO anon
WITH CHECK (true);

-- 読み取りポリシー（例）
CREATE POLICY "Anyone can read scores"
ON scores FOR SELECT
TO anon
USING (true);
```

## 検証

マイグレーション後、以下のクエリで確認：

```sql
-- カラムが追加されたか確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'scores'
ORDER BY ordinal_position;

-- インデックスが作成されたか確認
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'scores';

-- サンプルデータのスコアを確認
SELECT mode, endless_level, time_ms, miss_count, revive_count, score
FROM scores
LIMIT 10;
```

## トラブルシューティング

### エラー: カラムがすでに存在する

```sql
-- エラーを無視して続行（IF NOT EXISTS使用）
```

### エラー: 制約違反

```sql
-- 制約をいったん削除
ALTER TABLE scores DROP CONSTRAINT IF EXISTS player_name_length;

-- データを修正
UPDATE scores SET player_name = LEFT(player_name, 50) WHERE length(player_name) > 50;

-- 制約を再追加
ALTER TABLE scores ADD CONSTRAINT player_name_length CHECK (length(player_name) <= 50);
```

## ロールバック

もし問題が発生した場合：

```sql
-- カラムを削除
ALTER TABLE scores 
DROP COLUMN IF EXISTS player_name,
DROP COLUMN IF EXISTS score,
DROP COLUMN IF EXISTS revive_count;

-- 新しいインデックスを削除
DROP INDEX IF EXISTS idx_scores_endless_score;
DROP INDEX IF EXISTS idx_scores_ta_score;

-- 古いインデックスを復元
CREATE INDEX idx_scores_endless ON scores (endless_level DESC, time_ms ASC) 
WHERE mode = 'endless';
CREATE INDEX idx_scores_ta ON scores (difficulty, time_ms ASC) 
WHERE mode = 'ta';
```

---

**最終更新**: 2026-02-08
