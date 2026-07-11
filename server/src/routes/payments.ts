import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

paymentsRouter.get("/payments", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .query(`
      SELECT TOP 200
        p.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        p.今回入金 AS currentPayment,
        p.今回売上 AS currentSales,
        p.今回請求 AS currentInvoice,
        p.前回入金 AS previousPayment,
        p.前回売上 AS previousSales,
        p.前回請求 AS previousInvoice
      FROM ET0160入金確認 p
      JOIN ET0020得意先 c ON p.得意先CD = c.得意先CD
      WHERE c.得意先名 LIKE @search
      ORDER BY p.得意先CD
    `);
  res.json(result.recordset);
});

paymentsRouter.get("/payments/:customerCode", async (req, res) => {
  const customerCode = Number(req.params.customerCode);
  if (!Number.isInteger(customerCode)) {
    res.status(400).json({ message: "得意先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("customerCode", sql.Int, customerCode)
    .query(`
      SELECT
        p.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        p.今回入金 AS currentPayment,
        p.今回売上 AS currentSales,
        p.今回請求 AS currentInvoice,
        p.前回入金 AS previousPayment,
        p.前回売上 AS previousSales,
        p.前回請求 AS previousInvoice,
        p.前々回入金 AS twoAgoPayment,
        p.前々回売上 AS twoAgoSales,
        p.前々回請求 AS twoAgoInvoice,
        p.前々々回入金 AS threeAgoPayment,
        p.前々々回売上 AS threeAgoSales,
        p.前々々回請求 AS threeAgoInvoice,
        p.請求後入金 AS afterInvoicePayment,
        p.前回請求締日 AS previousClosingDate
      FROM ET0160入金確認 p
      JOIN ET0020得意先 c ON p.得意先CD = c.得意先CD
      WHERE p.得意先CD = @customerCode
    `);
  const row = result.recordset[0];
  if (!row) {
    res.status(404).json({ message: "入金確認データが見つかりません" });
    return;
  }
  res.json(row);
});
