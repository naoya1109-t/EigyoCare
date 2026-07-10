# 初回実装 設計（design.md）

## 実装アプローチ

新規構築のため、以下の順序で段階的に実装する（各ステップ完了時に動作確認を行う）。

1. **プロジェクト雛形構築**: `repository-structure.md` に基づき `client/` `server/` の雛形を作成（Vite + React + TypeScript、Express + TypeScript、Tailwind CSS、ESLint/Prettier設定）
2. **DB接続基盤**: SQL Server への参照用接続（`server/src/db/`）、環境変数（`.env`）による接続情報管理
3. **認証基盤**: ログイン／ログアウトAPI、認証ミドルウェア、SQL Server上のセッションテーブル・書き込み用接続、ログイン画面
4. **共通コンポーネント**: グローバルナビゲーション（PC/スマホ両対応）、一覧テーブル、グラフ（Recharts）、検索・絞り込みフォーム
5. **マスタ参照系メニュー**（比較的シンプルなCRUD参照から着手）: 顧客情報、仕入先情報
6. **集計・グラフ系メニュー**: 担当者別売上推移、県別売上推移、担当者別売上対比、担当者別予算進捗
7. **明細参照系メニュー**: 請求情報、売掛金一覧、入金確認、返品、値引

> 順序の理由: 認証・共通部品を先に固めることで、以降のメニュー実装を並行しやすくする。マスタ参照（単純な一覧・詳細）で画面パターンを確立してから、集計・グラフ表示や複数条件の絞り込みを伴う画面に進む。

## 実装対象コンポーネント（新規作成）

`repository-structure.md` の命名規則に従い、メニューごとに以下を新規作成する。

| # | メニュー | フロント (`client/src/pages/`) | API (`server/src/routes/`) |
|---|---|---|---|
| 1 | ログイン認証 | `Login.tsx` | `auth.ts`（`/api/login` `/api/logout`） |
| 2 | 担当者別売上推移 | `SalesByRep.tsx` | `sales.ts`（`/api/sales/by-rep`） |
| 3 | 県別売上推移 | `SalesByPrefecture.tsx` | `sales.ts`（`/api/sales/by-prefecture`） |
| 4 | 顧客情報 | `Customers.tsx` | `customers.ts` |
| 5 | 仕入先情報 | `Suppliers.tsx` | `suppliers.ts` |
| 6 | 請求情報 | `Invoices.tsx` | `invoices.ts` |
| 7 | 売掛金一覧 | `Receivables.tsx` | `receivables.ts` |
| 8 | 入金確認 | `Payments.tsx` | `payments.ts` |
| 9 | 担当者別売上対比 | `SalesComparison.tsx` | `sales.ts`（`/api/sales/comparison`） |
| 10 | 担当者別予算進捗 | `BudgetProgress.tsx` | `budget.ts` |
| 11 | 返品 | `Returns.tsx` | `returns.ts` |
| 12 | 値引 | `Discounts.tsx` | `discounts.ts` |

共通コンポーネント（`client/src/components/`）として `GlobalNav`、`DataTable`、`TrendChart`（折れ線・棒）、`ProgressGauge`（`RadialBarChart`）、`FilterForm` を新規作成する。

## データ構造の変更

### 新規作成が必要なDBオブジェクト

本アプリ専用のオブジェクトとして、以下をSQL Server上に新規作成する（`repository-structure.md` の方針通り、基幹システムの既存テーブルとは分離）。

- **アプリユーザーテーブル**（ユーザーID／パスワードハッシュ／担当者コード）
- **セッションテーブル**（セッションID／セッションデータ／有効期限）

> **[要確認]** テーブルの物理配置（専用スキーマを新設するか、既存のどこかに間借りするか）はDBA側と要調整

### 参照のみ行う既存データ（基幹システム側）

`glossary.md` のドメイン用語に対応する、得意先・仕入先・売上実績・予算・請求・入金・売掛金・返品・値引の各データに対して SELECT のみを行う。実際の物理テーブル・ビュー名、カラム名は未確認（`functional-design.md` のER図は仮称）のため、**実装着手前にDBスキーマ調査を行う**（`requirements.md` の制約事項を参照）。

## 影響範囲の分析

- **既存基幹システムへの影響**: 参照（SELECT）のみのアクセスであり、基幹システムの既存業務処理・データには影響を与えない
- **新規に発生する負荷**: 各メニューでの一覧取得・集計クエリが基幹システムのDBに対して新たに発行される。ピーク時間帯（月末等）のクエリ負荷は要注意
  > **[要確認]** 基幹システム側でのクエリ負荷の許容範囲、参照用アカウントに対するリソース制限の要否
- **新規に必要なDB作業**: アプリ用ユーザーテーブル・セッションテーブルの新規作成、参照専用アカウントおよびセッションテーブル書き込み用アカウントの発行
- **本番サーバー側の準備作業**: `iisnode` がサーバーに未導入の場合、事前にインストールが必要（`architecture.md` 参照）。開発機（IISなし）では確認できないため、本番デプロイ前に検証環境での動作確認が必要
- **既存の他システムへの影響**: なし（本アプリは新規のスタンドアロンWebアプリであり、他システムから参照・依存されない）
