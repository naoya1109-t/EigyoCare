import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const salesRouter = Router();
salesRouter.use(requireAuth);

salesRouter.get("/sales/by-rep", async (req, res) => {
  const repCode = req.query.repCode ? Number(req.query.repCode) : undefined;
  const months = req.query.months ? Number(req.query.months) : 12;
  const pool = await getReadonlyPool();
  const request = pool.request().input("months", sql.Int, months);

  let query: string;
  if (repCode !== undefined) {
    request.input("repCode", sql.SmallInt, repCode);
    query = `
      SELECT TOP (@months)
        FORMAT(s.売上年月, 'yyyy-MM') AS month,
        s.担当者CD AS repCode,
        r.担当者名 AS repName,
        s.売上金額 AS salesAmount,
        s.粗利金額 AS grossProfit
      FROM ET0100担当者別売上 s
      JOIN ET0010担当者 r ON s.担当者CD = r.担当者CD
      WHERE s.担当者CD = @repCode
      ORDER BY s.売上年月 DESC
    `;
  } else {
    query = `
      SELECT TOP (@months)
        FORMAT(s.売上年月, 'yyyy-MM') AS month,
        NULL AS repCode,
        '全社計' AS repName,
        SUM(s.売上金額) AS salesAmount,
        SUM(s.粗利金額) AS grossProfit
      FROM ET0100担当者別売上 s
      GROUP BY FORMAT(s.売上年月, 'yyyy-MM'), s.売上年月
      ORDER BY s.売上年月 DESC
    `;
  }
  const result = await request.query(query);
  res.json(result.recordset.reverse());
});

salesRouter.get("/sales/by-prefecture", async (req, res) => {
  const prefectureCode = req.query.prefectureCode ? Number(req.query.prefectureCode) : undefined;
  const months = req.query.months ? Number(req.query.months) : 12;
  const pool = await getReadonlyPool();
  const request = pool.request().input("months", sql.Int, months);

  let query: string;
  if (prefectureCode !== undefined) {
    request.input("prefectureCode", sql.TinyInt, prefectureCode);
    query = `
      SELECT TOP (@months)
        FORMAT(s.売上年月, 'yyyy-MM') AS month,
        s.県CD AS prefectureCode,
        p.県名 AS prefectureName,
        SUM(s.売上金額) AS salesAmount,
        SUM(s.粗利金額) AS grossProfit
      FROM ET0140県別担当者別売上 s
      JOIN ET0001県 p ON s.県CD = p.県CD
      WHERE s.県CD = @prefectureCode
      GROUP BY FORMAT(s.売上年月, 'yyyy-MM'), s.売上年月, s.県CD, p.県名
      ORDER BY s.売上年月 DESC
    `;
  } else {
    query = `
      SELECT TOP (@months)
        FORMAT(s.売上年月, 'yyyy-MM') AS month,
        NULL AS prefectureCode,
        '全国計' AS prefectureName,
        SUM(s.売上金額) AS salesAmount,
        SUM(s.粗利金額) AS grossProfit
      FROM ET0140県別担当者別売上 s
      GROUP BY FORMAT(s.売上年月, 'yyyy-MM'), s.売上年月
      ORDER BY s.売上年月 DESC
    `;
  }
  const result = await request.query(query);
  res.json(result.recordset.reverse());
});

salesRouter.get("/sales/comparison", async (_req, res) => {
  const pool = await getReadonlyPool();
  const result = await pool.request().query(`
    SELECT
      s.担当者CD AS repCode,
      r.担当者名 AS repName,
      s.売上金額 AS salesAmount,
      s.粗利金額 AS grossProfit
    FROM ET0100担当者別売上 s
    JOIN ET0010担当者 r ON s.担当者CD = r.担当者CD
    WHERE s.売上年月 = (SELECT MAX(売上年月) FROM ET0100担当者別売上)
    ORDER BY s.売上金額 DESC
  `);
  res.json(result.recordset);
});
