-- 仕入先情報詳細画面「直近12ヶ月の買掛推移」用のビュー。
-- ET0135買掛を直接クエリせず、ビュー経由でアクセスするために作成。
-- ET0130売掛と同様、今回買掛残高は「その月単独の仕入額-支払額」であり累積残高ではない
-- （app.ReceivablesByCustomer と同じ構造。詳細は functional-design.md 参照）。

IF NOT EXISTS (SELECT 1 FROM sys.views v JOIN sys.schemas s ON v.schema_id = s.schema_id WHERE s.name = 'app' AND v.name = 'PayablesBySupplier')
BEGIN
    EXEC('
        CREATE VIEW app.PayablesBySupplier AS
        SELECT
            仕入先CD AS 仕入先CD,
            年月 AS 年月,
            仕入額 AS 仕入額,
            値引額 AS 値引額,
            支払額 AS 支払額,
            今回買掛残高 AS 今回買掛残高
        FROM dbo.ET0135買掛
    ');
END
ELSE
BEGIN
    EXEC('
        ALTER VIEW app.PayablesBySupplier AS
        SELECT
            仕入先CD AS 仕入先CD,
            年月 AS 年月,
            仕入額 AS 仕入額,
            値引額 AS 値引額,
            支払額 AS 支払額,
            今回買掛残高 AS 今回買掛残高
        FROM dbo.ET0135買掛
    ');
END
GO
