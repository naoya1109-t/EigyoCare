import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const salesRouter = Router();
salesRouter.use(requireAuth);

// 断片的な将来データ（件数が少ない月）を除外した、選択可能な「実績が揃っている月」一覧
salesRouter.get("/sales/rep-months", async (_req, res) => {
  const pool = await getReadonlyPool();
  const result = await pool.request().query(`
    SELECT TOP 12 FORMAT(売上年月, 'yyyy-MM') AS month
    FROM ET0100担当者別売上
    GROUP BY FORMAT(売上年月, 'yyyy-MM'), 売上年月
    HAVING COUNT(*) > 30
    ORDER BY 売上年月 DESC
  `);
  res.json(result.recordset.map((r: { month: string }) => r.month));
});

// 県別売上推移と同じパターンに変更: 担当者を1人ずつ選ぶより、対象月の全担当者を並べて比較したいという
// フィードバックにより、月次推移ではなく対象月の全担当者一括比較（棒グラフ用）に変更した
salesRouter.get("/sales/by-rep", async (req, res) => {
  const pool = await getReadonlyPool();

  let month = typeof req.query.month === "string" ? req.query.month : undefined;
  if (month === undefined) {
    const latest = await pool.request().query(`
      SELECT TOP 1 FORMAT(売上年月, 'yyyy-MM') AS month
      FROM ET0100担当者別売上
      GROUP BY FORMAT(売上年月, 'yyyy-MM'), 売上年月
      HAVING COUNT(*) > 30
      ORDER BY 売上年月 DESC
    `);
    month = latest.recordset[0]?.month;
  }
  if (!month) {
    res.json([]);
    return;
  }

  const result = await pool
    .request()
    .input("month", sql.VarChar, month)
    .query(`
      SELECT
        s.担当者CD AS repCode,
        r.担当者名 AS repName,
        s.売上金額 AS salesAmount,
        s.粗利金額 AS grossProfit
      FROM ET0100担当者別売上 s
      JOIN ET0010担当者 r ON s.担当者CD = r.担当者CD
      WHERE FORMAT(s.売上年月, 'yyyy-MM') = @month
      ORDER BY s.売上金額 DESC
    `);
  res.json(result.recordset);
});

// 断片的な将来データ（件数が少ない月）を除外した、選択可能な「実績が揃っている月」一覧
salesRouter.get("/sales/prefecture-months", async (_req, res) => {
  const pool = await getReadonlyPool();
  const result = await pool.request().query(`
    SELECT TOP 12 FORMAT(売上年月, 'yyyy-MM') AS month
    FROM ET0140県別担当者別売上
    GROUP BY FORMAT(売上年月, 'yyyy-MM'), 売上年月
    HAVING COUNT(*) > 60
    ORDER BY 売上年月 DESC
  `);
  res.json(result.recordset.map((r: { month: string }) => r.month));
});

// 都道府県を1つずつ選ぶより、対象月の全県を並べて比較したいというフィードバックにより、
// 月次推移ではなく対象月の全県一括比較（棒グラフ用）に変更した。
// 月初は当月分の実績がまだ少ないため、月を選べるようにしている（未指定時は直近の実績が揃っている月）
salesRouter.get("/sales/by-prefecture", async (req, res) => {
  const pool = await getReadonlyPool();

  let month = typeof req.query.month === "string" ? req.query.month : undefined;
  if (month === undefined) {
    const latest = await pool.request().query(`
      SELECT TOP 1 FORMAT(売上年月, 'yyyy-MM') AS month
      FROM ET0140県別担当者別売上
      GROUP BY FORMAT(売上年月, 'yyyy-MM'), 売上年月
      HAVING COUNT(*) > 60
      ORDER BY 売上年月 DESC
    `);
    month = latest.recordset[0]?.month;
  }
  if (!month) {
    res.json([]);
    return;
  }

  const result = await pool
    .request()
    .input("month", sql.VarChar, month)
    .query(`
      SELECT
        s.県CD AS prefectureCode,
        p.県名 AS prefectureName,
        SUM(s.売上金額) AS salesAmount,
        SUM(s.粗利金額) AS grossProfit
      FROM ET0140県別担当者別売上 s
      JOIN ET0001県 p ON s.県CD = p.県CD
      WHERE FORMAT(s.売上年月, 'yyyy-MM') = @month
      GROUP BY s.県CD, p.県名
      ORDER BY SUM(s.売上金額) DESC
    `);
  res.json(result.recordset);
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
    WHERE s.売上年月 = (SELECT MAX(売上年月) FROM (SELECT 売上年月 FROM ET0100担当者別売上 GROUP BY 売上年月 HAVING COUNT(*) > 30) t)
    ORDER BY s.売上金額 DESC
  `);
  res.json(result.recordset);
});
