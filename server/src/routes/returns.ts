import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const returnsRouter = Router();
returnsRouter.use(requireAuth);

// 返品専用テーブルは存在しないため、ET0120請求明細の区分='4' を返品行として扱う（推測。要業務確認。functional-design.md参照）
returnsRouter.get("/returns", async (req, res) => {
  const customerCode = req.query.customerCode ? Number(req.query.customerCode) : undefined;
  const pool = await getReadonlyPool();
  const request = pool.request();
  if (customerCode !== undefined) request.input("customerCode", sql.Int, customerCode);
  const result = await request.query(`
    SELECT TOP 200
      d.請求明細番号 AS lineNumber,
      d.売上日 AS saleDate,
      i.得意先CD AS customerCode,
      c.得意先名 AS customerName,
      d.商品名 AS item,
      d.受注数量 AS quantity,
      d.販売単価 AS unitPrice,
      d.販売金額 AS amount,
      d.行備考 AS remarks
    FROM ET0120請求明細 d
    JOIN ET0110請求 i ON d.請求番号 = i.請求番号
    JOIN ET0020得意先 c ON i.得意先CD = c.得意先CD
    WHERE d.区分 = '4' ${customerCode !== undefined ? "AND i.得意先CD = @customerCode" : ""}
    ORDER BY d.売上日 DESC
  `);
  res.json(result.recordset);
});
