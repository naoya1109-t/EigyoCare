-- 本アプリ専用オブジェクトを、基幹システムの既存テーブルと分離するため
-- 専用スキーマ "app" に作成する。（architecture.md / repository-structure.md 参照）

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'app')
BEGIN
    EXEC('CREATE SCHEMA app');
END
GO

-- express-session のストア（connect-mssql-v2）が要求するスキーマ
-- (sid / session / expires の列名・型は connect-mssql-v2 の実装依存のため変更不可)
IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'app' AND t.name = 'Sessions')
BEGIN
    CREATE TABLE app.Sessions (
        sid NVARCHAR(255) NOT NULL PRIMARY KEY,
        session NVARCHAR(MAX) NOT NULL,
        expires DATETIME NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'app' AND t.name = 'AppUser')
BEGIN
    CREATE TABLE app.AppUser (
        ユーザーID NVARCHAR(50) NOT NULL PRIMARY KEY,
        パスワードハッシュ NVARCHAR(255) NOT NULL,
        担当者コード NVARCHAR(20) NOT NULL,
        作成日時 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        更新日時 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO
