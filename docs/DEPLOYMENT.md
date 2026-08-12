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

1. https://supabase.com/ でアカウント作成・ログイン
2. Organization を作成（Type: Personal、Plan: Free）
3. **New project** でプロジェクトを作成
   - Project name: 任意（例: `gradient-sweeper`）
   - Database password: Generate a passwordで自動生成しメモ
   - Region: **Northeast Asia (Tokyo)** 推奨
   - Enable automatic RLS: **OFF**（テーブル作成後に手動で ON にする。下記「RLS（Row Level Security）」参照）
4. プロジェクト作成完了後、Settings → **API Keys** を開く
5. **Secret keys** の `sb_secret_...` をコピー（`SUPABASE_SERVICE_ROLE_KEY` に使用）

### 2. テーブルの作成

SQL Editor で下記「DBスキーマ・マイグレーション」セクションのSQLを実行。

### 3. RLS（Row Level Security）

`scores` テーブルへのアクセスはすべて Next.js の API Route 経由で、
サーバー専用の `SUPABASE_SERVICE_ROLE_KEY` を使っている。
サービスロールキーは RLS をバイパスするため、**RLS を有効にしてもアプリの動作は変わらない**。

有効にする意味は、鍵が漏れたときの被害範囲を変えることにある。
現状は RLS 未設定なので、公開鍵（anon / publishable key）が第三者の手に渡ると、
そのままクライアントから `scores` を直接 insert / update / delete できてしまう。
RLS を有効にしてポリシーを 1 つも作らなければ、サービスロールキー以外は何もできなくなる。

テーブル作成後に SQL Editor で実行する。

```sql
-- RLS を有効化する。ポリシーを作らない = anon / authenticated からは一切アクセス不可。
-- API Route が使うサービスロールキーは RLS をバイパスするので影響を受けない。
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
```

ランキングをクライアントから直接読みたくなった場合だけ、読み取りポリシーを足す
（現在は `/api/leaderboard` 経由で読んでいるので不要）。

```sql
-- 必要になったときだけ。読み取りのみ許可し、書き込みは API Route に限定したままにする。
CREATE POLICY "scores are readable by anyone"
ON scores FOR SELECT
TO anon, authenticated
USING (true);
```

#### DB 側の下限チェック（任意）

サーバー側の検証（`src/lib/score-validation.ts`）とは別に、DB にも制約を置いておくと
API Route を経由しない書き込みが混ざったときに気づける。既存データがこれを満たすことを
確認してから追加すること。

```sql
ALTER TABLE scores
ADD CONSTRAINT scores_non_negative CHECK (score >= 0),
ADD CONSTRAINT scores_endless_has_level
  CHECK (mode <> 'endless' OR endless_level >= 1),
ADD CONSTRAINT scores_ta_has_time
  CHECK (mode <> 'ta' OR (difficulty IS NOT NULL AND time_ms >= 0));
```

> **補足**: `score` カラムは INTEGER（int4、最大 2147483647）。
> これを超える値は API 側で 422 として拒否している。

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
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | Secret Key（秘密鍵・新形式） |

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

### ビルドが失敗する（Secrets scanning）

Netlifyのシークレットスキャナーが環境変数を検知してビルドを止めることがある。
`netlify.toml` の `[build.environment]` に以下を追加済み：

```toml
SECRETS_SCAN_OMIT_KEYS = "NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
```

### ビルドが失敗する（その他）

1. Netlifyの **Deploy logs** を確認
2. エラーメッセージの最後の数行をチェック
3. ローカルで `npm run build` が通るか確認

### 環境変数が反映されない

- Netlifyで環境変数を追加/変更した後は **再デプロイが必要**
- Deploysタブ → **Trigger deploy** → **Clear cache and deploy**

### ランキングが表示されない / 本番でSupabaseのデータが読めない

**まず「モックモードに落ちているのか、DB側の問題なのか」を切り分ける。**

`src/app/api/leaderboard/route.ts` は `NEXT_PUBLIC_SUPABASE_URL` が未設定のとき、
エラーを出さずに**黙ってモックデータを返す**。この挙動があるため、
画面を見ただけでは「DBが空」と「環境変数が消えている」の区別がつかない。

#### 判定

ランキング画面、または `/api/leaderboard?mode=endless` のレスポンスを見る。

| 見えているもの | 原因 | 対処 |
|---|---|---|
| `Player1` / `Player2` / `Player3` という固定データ | **モックモード**。Netlifyの環境変数が未設定または消失している | 下記A |
| `Database error`（500）または空のランキング | **Supabase側**。プロジェクトの一時停止、テーブル欠損、キーの失効 | 下記B |

#### A. 環境変数が原因の場合

1. Netlify Site settings → **Environment variables** に
   `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` が存在するか確認
2. 無ければ再設定（値は Supabase ダッシュボードの Settings → API Keys から取得）
3. **再デプロイが必須**。Deploys → **Trigger deploy** → **Clear cache and deploy**

#### B. Supabase側が原因の場合

1. https://supabase.com/ のダッシュボードでプロジェクトの状態を確認する。
   **無料プランは一定期間アクセスが無いとプロジェクトが一時停止される。**
   長期間放置していた場合はこれが最有力。停止していれば Restore / Resume で復帰させる
2. 復帰後、Table Editor で `scores` テーブルが残っているか確認。
   消えていれば「DBスキーマ・マイグレーション」のSQLを再実行する
3. Settings → API Keys でキーがローテーションされていないか確認。
   変わっていれば Netlify 側の `SUPABASE_SERVICE_ROLE_KEY` も更新して再デプロイ
4. Netlify の Function logs で `Supabase error:` の実際のメッセージを確認する
   （`route.ts` が `console.error` で出力している）

> キーの実値はこのドキュメントを含めリポジトリ内のどこにも書かないこと。

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

プロジェクト全体の優先順位と着手順は `docs/ROADMAP.md` を参照。
デプロイ・インフラ観点で残っているものは以下。

- [x] ランキングDB本番化（Supabase設定）
- [ ] ハブサイト（hanage.app）の構築
- [ ] Service Workerの実装（オフライン対応）
- [ ] Supabase の RLS 設定（手順は「Supabaseの設定 → RLS（Row Level Security）」に記載済み。本番プロジェクトで実行するだけ）

---

*最終更新: 2026-02-16*
