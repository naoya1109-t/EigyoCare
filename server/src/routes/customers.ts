import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";
import { addMonths, toYearMonth } from "../services/budgetProgress";

export const customersRouter = Router();
customersRouter.use(requireAuth);

const LIST_COLUMNS = `
  c.得意先CD AS customerCode,
  c.得意先名 AS customerName,
  c.得意先名カナ AS customerNameKana,
  p.県名 AS prefecture,
  c.TEL AS tel,
  r.担当者名 AS repName
`;

const DETAIL_COLUMNS = `
  c.得意先CD AS customerCode,
  c.得意先名 AS customerName,
  c.得意先名カナ AS customerNameKana,
  c.郵便番号 AS zipCode,
  p.県名 AS prefecture,
  c.住所1 AS address1,
  c.住所2 AS address2,
  c.TEL AS tel,
  c.FAX AS fax,
  c.EMail AS email,
  c.担当者部署 AS contactDept,
  c.担当者役職 AS contactTitle,
  c.担当者名 AS contactName,
  r.担当者名 AS repName,
  c.締日 AS closingDay,
  c.最終購買日 AS lastPurchaseDate,
  c.最終入金日 AS lastPaymentDate
`;

customersRouter.get("/customers", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const prefectureCode = req.query.prefectureCode ? Number(req.query.prefectureCode) : undefined;
  const repCode = req.query.repCode ? Number(req.query.repCode) : undefined;

  const pool = await getReadonlyPool();
  const request = pool.request().input("search", sql.NVarChar, `%${search}%`);
  if (prefectureCode !== undefined) request.input("prefectureCode", sql.TinyInt, prefectureCode);
  if (repCode !== undefined) request.input("repCode", sql.SmallInt, repCode);

  const result = await request.query(`
    SELECT TOP 200 ${LIST_COLUMNS}
    FROM ET0020得意先 c
    LEFT JOIN ET0001県 p ON c.県CD = p.県CD
    LEFT JOIN ET0010担当者 r ON c.営業担当CD = r.担当者CD
    WHERE (c.得意先名 LIKE @search OR c.得意先名カナ LIKE @search)
      ${prefectureCode !== undefined ? "AND c.県CD = @prefectureCode" : ""}
      ${repCode !== undefined ? "AND c.営業担当CD = @repCode" : ""}
    ORDER BY c.得意先CD
  `);
  res.json(result.recordset);
});

customersRouter.get("/customers/:code", async (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code)) {
    res.status(400).json({ message: "得意先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("code", sql.Int, code)
    .query(`
      SELECT ${DETAIL_COLUMNS}
      FROM ET0020得意先 c
      LEFT JOIN ET0001県 p ON c.県CD = p.県CD
      LEFT JOIN ET0010担当者 r ON c.営業担当CD = r.担当者CD
      WHERE c.得意先CD = @code
    `);
  const row = result.recordset[0];
  if (!row) {
    res.status(404).json({ message: "得意先が見つかりません" });
    return;
  }
  res.json(row);
});

// 直近12ヶ月（暦月固定）の売掛推移。ET0130売掛は取引が発生した月にしかレコードができないため、
// 取引のない月は0円として埋める。ET0130売掛を直接クエリせず app.ReceivablesByCustomer ビュー経由で
// 取得する（経緯は functional-design.md 参照）
customersRouter.get("/customers/:code/receivables", async (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code)) {
    res.status(400).json({ message: "得意先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();

  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => toYearMonth(addMonths(now, i - 11)));
  const startMonth = months[0].replace("-", "");
  const endMonth = months[months.length - 1].replace("-", "");

  const result = await pool
    .request()
    .input("code", sql.Int, code)
    .input("start", sql.Char, startMonth)
    .input("end", sql.Char, endMonth)
    .query(`
      SELECT 年月 AS yearMonth, 売上額 AS salesAmount, 入金額 AS paymentAmount
      FROM app.ReceivablesByCustomer
      WHERE 得意先CD = @code AND 年月 >= @start AND 年月 <= @end
    `);
  const byMonth = new Map(
    result.recordset.map((r: { yearMonth: string; salesAmount: number; paymentAmount: number }) => [
      r.yearMonth,
      r,
    ]),
  );

  const rows = months.map((month) => {
    const dbMonth = month.replace("-", "");
    const existing = byMonth.get(dbMonth);
    return {
      yearMonth: dbMonth,
      salesAmount: existing?.salesAmount ?? 0,
      paymentAmount: existing?.paymentAmount ?? 0,
    };
  });

  res.json(rows);
});
