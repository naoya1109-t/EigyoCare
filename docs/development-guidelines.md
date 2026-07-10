# 開発ガイドライン（development-guidelines.md）

## 前提

- `architecture.md` / `repository-structure.md` で確定した構成（TypeScript、React + Vite + Tailwind CSS + Recharts、Express、SQL Server、GitHub）を前提とする。

## コーディング規約

- **言語**: TypeScript を `strict` モードで使用する（`any` 型の使用は避け、やむを得ず使う場合は理由をコメントで残す）
- **非同期処理**: `async/await` を基本とし、`.then()` チェーンは使わない
- **コンポーネント**: React は関数コンポーネント + Hooks に統一する（クラスコンポーネントは使用しない）
- **Lint / フォーマット**: ESLint + Prettier のルールに従う（`npm run lint` / `npm run format` をコミット前に実行する）
- **コメント**: 「何をしているか」ではなく「なぜそうしているか」（自明でない制約・理由）のみを書く。読めば分かることはコメントしない
- **DBアクセス**: SQLは `server/src/db/` または `server/src/services/` に閉じ、パラメータ化クエリを使用する（SQLインジェクション対策。`repository-structure.md` 参照）

## 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| React コンポーネントファイル | PascalCase | `SalesByRep.tsx` |
| コンポーネント以外のファイル（hooks, utils等） | camelCase | `useSalesData.ts` |
| 変数・関数 | camelCase | `fetchCustomerList` |
| 型・インターフェース | PascalCase | `CustomerResponse` |
| 定数 | UPPER_SNAKE_CASE | `SESSION_TIMEOUT_MS` |
| APIエンドポイントパス | kebab-case（`functional-design.md` のAPI設計に準拠） | `/api/sales/by-rep` |
| DBの物理カラム名とアプリ内の型のマッピング | DB側は基幹システムの既存命名に従い、アプリ内（TypeScriptの型）では camelCase に変換して扱う | `得意先コード` → `customerCode` |

## スタイリング規約

- Tailwind CSS を使用し、独自CSS（`.css` ファイルの追加）は最小限にとどめる
- レスポンシブ対応は **モバイルファースト**（まずスマートフォン向けに組み、`md:` `lg:` 等のブレークポイントでPC向けを追加）で統一する
- 色・フォント等の共通デザイントークンは `client/tailwind.config.ts` で一元管理し、コンポーネント側にハードコードしない
- ナビゲーションはPCでサイドメニュー、スマートフォンではハンバーガーメニューに切り替える（`functional-design.md` の方針に準拠）

## テスト規約

- **テストフレームワーク**: Vitest（Vite / TypeScript との親和性のため）
  - フロントエンド: Vitest + React Testing Library
  - バックエンド: Vitest
- **テスト対象**: 集計・計算ロジック（`server/src/services/`）、共通コンポーネント（`client/src/components/`）を優先してカバーする
- **テストファイルの配置**: テスト対象ファイルと同じディレクトリに `〇〇.test.ts` / `〇〇.test.tsx` として配置する
  > **[要確認]** カバレッジ目標（例: 主要ロジック80%以上、等）やE2Eテスト（画面をブラウザ操作で通しで検証するテスト）の要否は未定。小規模チームでの運用負荷とのバランスで決める

## Git規約

- **リポジトリ**: [https://github.com/naoya1109-t/EigyoCare.git](https://github.com/naoya1109-t/EigyoCare.git)
- **ブランチ運用**: `main` ブランチを本番相当とし、作業は機能単位のブランチ（例: `feature/sales-by-rep`）を切って `main` にマージする（GitHub Flow）
- **コミットメッセージ**: 日本語で「何を」「なぜ」変更したかが分かるように簡潔に書く（例: `担当者別売上推移のグラフ表示を追加`）
  > **[要確認]** コミットメッセージの形式（Conventional Commits 等の規約に従うか、自由記述か）は未確定
- **プルリクエスト**: 作業ブランチから `main` へは Pull Request 経由でマージする
  > **[要確認]** レビュー必須とするか（開発者が1名の場合はセルフマージを許容するか）は運用体制に応じて決める
- **`.steering/` との対応**: 各作業ブランチは対応する `.steering/[YYYYMMDD]-[開発タイトル]/` のディレクトリと1対1に対応させ、作業の意図を追跡できるようにする
