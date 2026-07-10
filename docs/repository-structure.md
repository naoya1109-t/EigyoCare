# リポジトリ構造定義書（repository-structure.md）

## 前提

- `architecture.md` で確定した構成（Node.js + Express + TypeScript のバックエンド、React + Vite + TypeScript + Tailwind CSS + Recharts のフロントエンド、SQL Server 直結、本番は IIS + `iisnode`）を踏まえたフォルダ構成を定義する。
- バックエンド（`server/`）とフロントエンド（`client/`）を分離した構成とし、本番環境では `server` が `client` のビルド成果物（静的ファイル）を配信する。

## フォルダ構成（全体）

```
EigyoCare/
├── client/                    # フロントエンド（React + Vite + TypeScript）
│   ├── public/                 # 静的ファイル（favicon等）
│   ├── src/
│   │   ├── api/                 # バックエンドAPI呼び出し関数（fetchラッパー）
│   │   ├── components/          # 共通コンポーネント（テーブル、グラフ、検索フォーム等）
│   │   ├── pages/                # 画面単位のコンポーネント（メニューごとに1ファイル/フォルダ）
│   │   ├── hooks/                # カスタムフック
│   │   ├── types/                # 型定義（APIレスポンスの型等）
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                    # バックエンド（Express + TypeScript）
│   ├── src/
│   │   ├── routes/               # ルーティング定義（機能設計書のAPI設計に対応）
│   │   ├── controllers/          # リクエスト処理・レスポンス組み立て
│   │   ├── services/             # ビジネスロジック・集計処理
│   │   ├── db/                    # SQL Server 接続・クエリ実行
│   │   ├── middlewares/          # 認証チェック等の共通ミドルウェア
│   │   ├── config/                # 環境変数の読み込み・設定値
│   │   ├── types/                 # 型定義（DBレコードの型等）
│   │   └── app.ts                 # Expressアプリのエントリポイント
│   ├── web.config                 # IIS/iisnode 用設定（本番デプロイ時のみ使用）
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                       # 永続的ドキュメント（CLAUDE.md参照）
├── .steering/                  # 作業単位のドキュメント（CLAUDE.md参照）
├── .env.example                # 環境変数のサンプル（DB接続情報等、実値は含めない）
├── .gitignore
├── package.json                 # ルート（開発用スクリプトの一括実行等に使用）
└── README.md
```

## 各ディレクトリの役割

### `client/`（フロントエンド）

| ディレクトリ | 役割 |
|---|---|
| `src/api/` | バックエンドAPI（`/api/*`）を呼び出す関数群。画面から直接 `fetch` を書かず、必ずここを経由する |
| `src/components/` | 複数画面で使い回す共通コンポーネント（一覧テーブル、グラフ、ヘッダー、検索・絞り込みフォーム等）。`functional-design.md`「共通コンポーネント」に対応 |
| `src/pages/` | 画面単位のコンポーネント。`functional-design.md` のメニュー一覧（担当者別売上推移、顧客情報、等）に1対1で対応させる |
| `src/hooks/` | データ取得・状態管理等のカスタムフック |
| `src/types/` | APIレスポンスの型など、フロントエンドで使う型定義 |

### `server/`（バックエンド）

| ディレクトリ | 役割 |
|---|---|
| `src/routes/` | `functional-design.md`「API設計」の各エンドポイントに対応するルーティング定義 |
| `src/controllers/` | リクエストの受け取り・バリデーション・レスポンス組み立て |
| `src/services/` | 売上集計、予算進捗計算等のビジネスロジック（SQLクエリの組み立てを含む） |
| `src/db/` | SQL Server への接続処理（`mssql` パッケージ）、コネクション管理 |
| `src/middlewares/` | ログイン認証チェック等、複数ルートで共通利用するミドルウェア |
| `src/config/` | `.env` の読み込み、DB接続情報・セッション設定等の一元管理 |
| `web.config` | 本番の IIS 上で `iisnode` に処理を引き渡すための設定ファイル（開発環境では使用しない） |

## ファイル配置ルール

- **画面（`pages/`）とAPI（`routes/`）の対応**: `functional-design.md` のメニュー番号・名称を基準に、`client/src/pages/` と `server/src/routes/` のファイル名を対応させる（例: 「担当者別売上推移」→ `pages/SalesByRep.tsx` と `routes/sales.ts` の `/api/sales/by-rep`）
- **共通コンポーネントか画面専用コンポーネントか**: 2画面以上で使う場合は `client/src/components/` に置く。1画面でしか使わない場合は `client/src/pages/` 配下にその画面のサブディレクトリを作り、その中に置く
- **DBアクセスの置き場所**: SQL文の組み立て・実行は `server/src/db/` または `server/src/services/` に閉じ、`controllers/` から直接SQLを書かない
- **環境変数**: DB接続文字列・セッションシークレット等は `.env` にのみ記載し、リポジトリにコミットしない（`.env.example` にキー名のみ記載する）
- **ビルド成果物**: `client` のビルド成果物（`client/dist/`）はリポジトリに含めず（`.gitignore` 対象）、デプロイ時にビルドして `server` から配信する

## 開発環境・本番環境でのファイルの扱いの違い

- 開発環境（IISなしの手元PC）では `web.config` は参照されない。ローカルでは `client`（Vite dev server）と `server`（`nodemon`）をそれぞれ個別に起動する
- 本番環境（Windows Server + IIS）では、`client` をビルドした静的ファイルを `server` が配信し、`web.config` を通じて IIS から `iisnode` 経由で `server` にアクセスする
- この違いにより、`web.config` の動作確認はローカルでは行えないため、本番デプロイ後に別途確認する（`architecture.md` 参照）
