# EigyoCare

社内営業担当者向けの営業支援Webアプリケーション。詳細は `docs/` 配下の各ドキュメントを参照。

- `docs/product-requirements.md` - プロダクト要求定義書
- `docs/functional-design.md` - 機能設計書
- `docs/architecture.md` - 技術仕様書
- `docs/repository-structure.md` - リポジトリ構造定義書
- `docs/development-guidelines.md` - 開発ガイドライン
- `docs/glossary.md` - ユビキタス言語定義

## 構成

- `client/` - フロントエンド（React + Vite + TypeScript + Tailwind CSS）
- `server/` - バックエンド（Express + TypeScript、SQL Server接続）

本番はWindows Server + IIS（`iisnode`）上で稼働するが、開発機にはIISが無いため、
ローカル開発は `client` と `server` をそれぞれ個別に起動する構成になっている（`docs/architecture.md` 参照）。

## ローカル開発手順

### 1. 環境変数の設定

```bash
cp server/.env.example server/.env
# server/.env にDB接続情報・セッションシークレットを設定する
```

### 2. インストール

```bash
cd server && npm install
cd ../client && npm install
```

### 3. 起動（別々のターミナルで）

```bash
# バックエンド（http://localhost:3000）
cd server && npm run dev

# フロントエンド（http://localhost:5173、/api は自動的にバックエンドへプロキシされる）
cd client && npm run dev
```

ブラウザで `http://localhost:5173` にアクセスして確認する。

## 本番デプロイ

Windows Server + IIS（`iisnode`）上で稼働させる。詳細は `docs/architecture.md` を参照。
`server/web.config` は本番デプロイ時のみ使用し、開発環境では参照されない。
