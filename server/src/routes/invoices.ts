import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);

invoicesRouter.get("/invoices", async (req, res) => {
  const customerCode = req.query.customerCode ? Number(req.query.customerCode) : undefined;
  const pool = await getReadonlyPool();
  const request = pool.request();
  if (customerCode !== undefined) request.input("customerCode", sql.Int, customerCode);
  const result = await request.query(`
    SELECT TOP 200
      i.請求番号 AS invoiceNo,
      i.請求日 AS invoiceDate,
      i.得意先CD AS customerCode,
      c.得意先名 AS customerName,
      i.売上額 AS salesAmount,
      i.消費税額 AS taxAmount,
      i.入金額 AS paymentAmount,
      i.今回請求残高 AS balance
    FROM ET0110請求 i
    JOIN ET0020得意先 c ON i.得意先CD = c.得意先CD
    WHERE 1=1 ${customerCode !== undefined ? "AND i.得意先CD = @customerCode" : ""}
    ORDER BY i.請求日 DESC
  `);
  res.json(result.recordset);
});

invoicesRouter.get("/invoices/:no", async (req, res) => {
  const invoiceNo = Number(req.params.no);
  if (!Number.isInteger(invoiceNo)) {
    res.status(400).json({ message: "請求番号が不正です" });
    return;
  }
  const pool = await getReadonlyPool();

  const headerResult = await pool
    .request()
    .input("no", sql.Int, invoiceNo)
    .query(`
      SELECT
        i.請求番号 AS invoiceNo,
        i.請求日 AS invoiceDate,
        i.回収予定日 AS dueDate,
        i.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        i.前回請求残高 AS previousBalance,
        i.売上額 AS salesAmount,
        i.消費税額 AS taxAmount,
        i.入金額 AS paymentAmount,
        i.今回請求残高 AS balance
      FROM ET0110請求 i
      JOIN ET0020得意先 c ON i.得意先CD = c.得意先CD
      WHERE i.請求番号 = @no
    `);
  const header = headerResult.recordset[0];
  if (!header) {
    res.status(404).json({ message: "請求が見つかりません" });
    return;
  }

  const linesResult = await pool
    .request()
    .input("no", sql.Int, invoiceNo)
    .query(`
      SELECT
        請求明細番号 AS lineNumber,
        売上日 AS saleDate,
        商品名 AS item,
        受注数量 AS quantity,
        販売単価 AS unitPrice,
        販売金額 AS amount,
        行備考 AS remarks
      FROM ET0120請求明細
      WHERE 請求番号 = @no
      ORDER BY 請求明細番号
    `);

  res.json({ ...header, lines: linesResult.recordset });
});
