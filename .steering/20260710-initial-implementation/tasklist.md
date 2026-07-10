# 初回実装 タスクリスト（tasklist.md）

進捗状況は各タスクのチェックボックスで管理する（未着手 `[ ]` / 完了 `[x]`）。

## フェーズ0: 事前調査

- [x] 基幹システムのDBスキーマ調査（得意先・仕入先・売上実績・予算・請求・入金・売掛金の物理テーブル・ビュー名、カラム名を確認し、`functional-design.md` のER図・`glossary.md` の対応表を実スキーマに合わせて更新済み。返品・値引は`ET0120請求明細`の区分コードからの推測のため、業務担当者への確認が別途必要）
- [x] アプリ用ユーザーテーブル・セッションテーブルの配置場所（専用スキーマの要否）をDBAと調整する
- [ ] 参照専用DB接続アカウント、およびセッションテーブル用の書き込み可能DB接続アカウントを発行してもらう

## フェーズ1: プロジェクト雛形構築

- [x] `repository-structure.md` に基づき `client/`（Vite + React + TypeScript）を初期化
- [x] `repository-structure.md` に基づき `server/`（Express + TypeScript）を初期化
- [x] Tailwind CSS のセットアップ（`client/tailwind.config.ts`）
- [x] ESLint + Prettier のセットアップ（`client/` `server/` 共通ルール）
- [x] `.env.example` の作成（DB接続情報・セッションシークレット等のキー名のみ記載）
- [x] `.gitignore` の整備（`node_modules/` `.env` `client/dist/` 等）
- [x] GitHubリポジトリ（`https://github.com/naoya1109-t/EigyoCare.git`）への初回コミット・push

## フェーズ2: DB接続基盤

- [x] `server/src/config/` で環境変数読み込みを実装
- [x] `server/src/db/` で SQL Server 接続処理（`mssql` パッケージ、参照用コネクション）を実装
- [x] 疎通確認用の簡易エンドポイントで接続確認

## フェーズ3: 認証基盤

- [x] SQL Server上にセッションテーブルを作成（自動作成 or DDLスクリプト）
- [x] `express-session` + セッションストアアダプタ（`connect-mssql-v2` 等）のセットアップ
- [x] アプリユーザーテーブルの作成、パスワードハッシュ化（`bcrypt`）の実装
- [x] ログインAPI（`POST /api/login`）の実装
- [x] ログアウトAPI（`POST /api/logout`）の実装
- [x] 認証チェックミドルウェア（未認証時に401を返す）の実装
- [x] ログイン画面（`client/src/pages/Login.tsx`）の実装
- [x] 未認証時にログイン画面へリダイレクトする処理をフロントエンドに実装

## フェーズ4: 共通コンポーネント

- [x] `GlobalNav`（PCサイドメニュー／スマホハンバーガーメニュー、レスポンシブ対応）
- [x] `DataTable`（一覧表示共通コンポーネント）
- [x] `TrendChart`（Recharts の `LineChart` / `BarChart` ラッパー）
- [x] `ProgressGauge`（Recharts の `RadialBarChart` ラッパー）
- [x] `FilterForm`（期間指定・担当者選択・得意先検索などの絞り込み共通コンポーネント）
- [x] `client/src/api/` にAPI呼び出し共通関数（fetchラッパー、401時のリダイレクト処理を含む）を実装

## フェーズ5: マスタ参照系メニュー

- [ ] 顧客情報一覧・詳細（API: `customers.ts` ／ 画面: `Customers.tsx`）
- [ ] 仕入先情報一覧・詳細（API: `suppliers.ts` ／ 画面: `Suppliers.tsx`）

## フェーズ6: 集計・グラフ系メニュー

- [ ] 担当者別売上推移（API: `sales.ts` の `/api/sales/by-rep` ／ 画面: `SalesByRep.tsx`）
- [ ] 県別売上推移（API: `sales.ts` の `/api/sales/by-prefecture` ／ 画面: `SalesByPrefecture.tsx`）
- [ ] 担当者別売上対比（API: `sales.ts` の `/api/sales/comparison` ／ 画面: `SalesComparison.tsx`）
- [ ] 担当者別予算進捗（API: `budget.ts` ／ 画面: `BudgetProgress.tsx`）

## フェーズ7: 明細参照系メニュー

- [ ] 請求情報一覧・明細（API: `invoices.ts` ／ 画面: `Invoices.tsx`）
- [ ] 売掛金一覧（API: `receivables.ts` ／ 画面: `Receivables.tsx`）
- [ ] 入金確認（API: `payments.ts` ／ 画面: `Payments.tsx`）
- [ ] 返品（API: `returns.ts` ／ 画面: `Returns.tsx`）
- [ ] 値引（API: `discounts.ts` ／ 画面: `Discounts.tsx`）

## フェーズ8: 品質チェック・結合確認

- [ ] 全画面について、PCブラウザでの表示確認
- [ ] 全画面について、スマートフォンブラウザでの表示確認（レスポンシブ）
- [ ] 全APIエンドポイントについて、未認証アクセス時に401が返ることを確認
- [ ] 表示データと基幹システム（SQL Server）上のデータの一致確認
- [ ] Lint・型チェック（`npm run lint` 等）の実行、エラーゼロを確認
- [ ] 主要なビジネスロジック（`server/src/services/`）・共通コンポーネントに対するテスト（Vitest）の作成・実行
- [ ] IISワーカープロセスのリサイクルを模したセッション永続化の確認（開発機では代替手段での確認、または検証環境での確認）

## 完了条件

- `requirements.md` の受け入れ条件をすべて満たしていること
- 第1目標の12機能（ログイン認証＋参照系11メニュー）が、開発機（IISなし・Vite dev server + Express直接起動）上で一通り動作すること
- Lint・型チェックがエラーなく通ること
- 本番デプロイ（IIS + iisnode）に必要な準備事項（`web.config`、iisnode導入確認、セッションテーブル・DB接続アカウント）が整理されていること
