import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const receivablesRouter = Router();
receivablesRouter.use(requireAuth);

receivablesRouter.get("/receivables", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .query(`
      SELECT TOP 200
        r.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        r.年月 AS yearMonth,
        r.売上額 AS salesAmount,
        r.入金額 AS paymentAmount,
        r.今回売掛残高 AS balance
      FROM ET0130売掛 r
      JOIN ET0020得意先 c ON r.得意先CD = c.得意先CD
      WHERE r.年月 = (SELECT MAX(年月) FROM (SELECT 年月 FROM ET0130売掛 GROUP BY 年月 HAVING COUNT(*) > 100) t)
        AND c.得意先名 LIKE @search
      ORDER BY r.今回売掛残高 DESC
    `);
  res.json(result.recordset);
});
