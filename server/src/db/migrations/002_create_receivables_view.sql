-- 顧客情報詳細画面「直近12ヶ月の売掛推移」用のビュー。
-- ET0130売掛を直接クエリせず、ビュー経由でアクセスするために作成。
-- 既存の類似ストアド（ES0120売掛推移）は担当者×会計年度で得意先を横に並べる別用途のもので、
-- 入金額も含まれないため流用できなかった（functional-design.md参照）。
--
-- 今回売掛残高は「その月単独の売上額-入金額」であり累積残高ではないことが判明したため、
-- 累積計算に使えるよう後から追加した（2026-07-13）。

IF NOT EXISTS (SELECT 1 FROM sys.views v JOIN sys.schemas s ON v.schema_id = s.schema_id WHERE s.name = 'app' AND v.name = 'ReceivablesByCustomer')
BEGIN
    EXEC('
        CREATE VIEW app.ReceivablesByCustomer AS
        SELECT
            得意先CD AS 得意先CD,
            年月 AS 年月,
            売上額 AS 売上額,
            入金額 AS 入金額,
            今回売掛残高 AS 今回売掛残高
        FROM dbo.ET0130売掛
    ');
END
ELSE
BEGIN
    EXEC('
        ALTER VIEW app.ReceivablesByCustomer AS
        SELECT
            得意先CD AS 得意先CD,
            年月 AS 年月,
            売上額 AS 売上額,
            入金額 AS 入金額,
            今回売掛残高 AS 今回売掛残高
        FROM dbo.ET0130売掛
    ');
END
GO
