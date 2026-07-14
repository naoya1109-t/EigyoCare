import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";
import { addMonths, toYearMonth } from "../services/budgetProgress";

export const suppliersRouter = Router();
suppliersRouter.use(requireAuth);

const LIST_COLUMNS = `
  s.仕入先CD AS supplierCode,
  s.仕入先名 AS supplierName,
  s.仕入先名カナ AS supplierNameKana,
  p.県名 AS prefecture,
  s.TEL AS tel
`;

const DETAIL_COLUMNS = `
  s.仕入先CD AS supplierCode,
  s.仕入先名 AS supplierName,
  s.仕入先名カナ AS supplierNameKana,
  s.郵便番号 AS zipCode,
  p.県名 AS prefecture,
  s.住所1 AS address1,
  s.住所2 AS address2,
  s.TEL AS tel,
  s.FAX AS fax,
  s.HP AS homepage,
  s.代表者氏名 AS representativeName,
  s.担当者部署 AS contactDept,
  s.担当者役職 AS contactTitle,
  s.担当者名 AS contactName,
  s.担TEL AS contactTel,
  s.Email AS email,
  s.備考 AS remarks
`;

suppliersRouter.get("/suppliers", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .query(`
      SELECT TOP 200 ${LIST_COLUMNS}
      FROM [10.194.5.55].Medical.dbo.T430仕入先 s
      LEFT JOIN ET0001県 p ON s.県CD = p.県CD
      WHERE s.取引終了 = 2
        AND (s.仕入先名 LIKE @search OR s.仕入先名カナ LIKE @search)
      ORDER BY s.仕入先CD
    `);
  res.json(result.recordset);
});

suppliersRouter.get("/suppliers/:code", async (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code)) {
    res.status(400).json({ message: "仕入先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("code", sql.SmallInt, code)
    .query(`
      SELECT ${DETAIL_COLUMNS}
      FROM [10.194.5.55].Medical.dbo.T430仕入先 s
      LEFT JOIN ET0001県 p ON s.県CD = p.県CD
      WHERE s.仕入先CD = @code
    `);
  const row = result.recordset[0];
  if (!row) {
    res.status(404).json({ message: "仕入先が見つかりません" });
    return;
  }
  res.json(row);
});

// 直近12ヶ月（暦月固定）の買掛推移。customers.ts の売掛推移と同じ考え方（詳細は functional-design.md 参照）。
// ET0135買掛は取引が発生した月にしかレコードができないため、取引のない月は0円として埋める。
// 買掛残は、app.PayablesBySupplier ビューの「今回買掛残高」列（実体は「その月単独の仕入額-支払額」であり
// 累積残高ではない）を仕入先の最初のレコードから対象月まで累積加算して算出する
suppliersRouter.get("/suppliers/:code/payables", async (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code)) {
    res.status(400).json({ message: "仕入先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();

  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => toYearMonth(addMonths(now, i - 11)).replace("-", ""));

  const historyResult = await pool
    .request()
    .input("code", sql.SmallInt, code)
    .query(`
      SELECT 年月 AS yearMonth, 仕入額 AS purchaseAmount, 支払額 AS paymentAmount, 今回買掛残高 AS monthlyDelta
      FROM app.PayablesBySupplier
      WHERE 仕入先CD = @code
      ORDER BY 年月 ASC
    `);
  const history: { yearMonth: string; purchaseAmount: number; paymentAmount: number; monthlyDelta: number }[] =
    historyResult.recordset;
  const byMonth = new Map(history.map((r) => [r.yearMonth, r]));

  let runningBalance = 0;
  let historyIndex = 0;
  const rows: { yearMonth: string; purchaseAmount: number; paymentAmount: number; balance: number }[] = [];
  for (const month of months) {
    while (historyIndex < history.length && history[historyIndex].yearMonth <= month) {
      runningBalance += history[historyIndex].monthlyDelta;
      historyIndex++;
    }
    const existing = byMonth.get(month);
    rows.push({
      yearMonth: month,
      purchaseAmount: existing?.purchaseAmount ?? 0,
      paymentAmount: existing?.paymentAmount ?? 0,
      balance: runningBalance,
    });
  }

  res.json(rows);
});
