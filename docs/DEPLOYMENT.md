# デプロイガイド

このドキュメントでは、Gradient Sweeperを本番環境にデプロイする手順を説明します。

## 目次

1. [Netlifyへのデプロイ](#netlifyへのデプロイ)
2. [Supabaseの設定（オプション）](#supabaseの設定オプション)
3. [環境変数の設定](#環境変数の設定)
4. [独自ドメインの設定](#独自ドメインの設定)

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

```bash
git add .
git commit -m "Update features"
git push origin main
```

---

## Supabaseの設定（オプション）

ランキング機能を本格運用する場合はSupabaseを設定します。

### 1. Supabaseプロジェクトの作成

1. https://supabase.com/ でプロジェクトを作成
2. Database Password を設定

### 2. テーブルの作成

SQL Editorで以下を実行：

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('endless', 'ta')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'mid', 'hard')),
  time_ms BIGINT NOT NULL,
  endless_level INT,
  miss_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Endless用インデックス
CREATE INDEX idx_scores_endless 
ON scores (endless_level DESC, time_ms ASC) 
WHERE mode = 'endless';

-- Time Attack用インデックス
CREATE INDEX idx_scores_ta 
ON scores (difficulty, time_ms ASC) 
WHERE mode = 'ta';
```

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
- モックモードの場合は3件のテストデータが表示されます

---

## 次のステップ

- [ ] Service Workerの実装（オフライン対応）
- [ ] Google Analytics / Plausible の導入
- [ ] OGP画像の設定
- [ ] パフォーマンス最適化（Lighthouse 100点目指す）

---

*最終更新: 2026-02-02*
