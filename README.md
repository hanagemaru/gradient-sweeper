# Gradient Sweeper

色ヒント型マインスイーパー - 2色の爆弾の配置を色のグラデーションで推理するパズルゲーム

## 概要

Gradient Sweeperは、マインスイーパーの概念に「色」の要素を加えた革新的なパズルゲームです。赤と青の2種類の爆弾があり、隣接する爆弾の数と種類に応じてセルの色がグラデーション表示されます。

## 特徴

- 🎨 **色で推理**: 赤・青の爆弾比率で色が変化
- ♾️ **Endlessモード**: 徐々に難易度が上がる無限モード
- ⏱️ **Time Attackモード**: 難易度別のタイムアタック
- 🏆 **ランキング**: オンラインランキング対応
- 🌐 **多言語対応**: 日本語/英語切替
- 📱 **PWA対応**: インストール可能なWebアプリ

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (オプション)
- **デプロイ**: Netlify

## ローカル開発

### 前提条件

- Node.js 20以上
- npm

### セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` を開く

### ビルド

```bash
npm run build
npm start
```

## デプロイ

### Netlifyへのデプロイ

1. GitHubリポジトリをNetlifyに接続
2. ビルド設定は `netlify.toml` に記載済み
3. （オプション）Supabaseを使用する場合は環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

**注**: Supabase未設定でもモックデータで動作します。

## プロジェクト構造

```
gradient-sweeper/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # UIコンポーネント
│   ├── hooks/            # カスタムフック
│   ├── lib/              # ユーティリティ・ロジック
│   ├── i18n/             # 多言語対応
│   └── types/            # TypeScript型定義
├── public/               # 静的ファイル
├── docs/                 # ドキュメント
└── netlify.toml          # Netlify設定
```

## ドキュメント

詳細なドキュメントは `docs/` フォルダを参照してください：

- [仕様書](./docs/SPEC.md)
- [ユーザーガイド](./docs/USER-GUIDE.md)
- [進捗管理](./docs/PROGRESS.md)
- [技術仕様](./docs/technical/)

## ライセンス

このプロジェクトは個人開発のため、ライセンスは未設定です。

## リンク

- **本番環境**: https://sweeper.hanage.app
- **リポジトリ**: https://github.com/hanagemaru/gradient-sweeper
- **Netlifyデフォルト**: https://silly-dodol-4def9c.netlify.app

---

*Created with ❤️ by hanagemaru*
