import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";
import { BUDGET_MONTH_COLUMNS, computeBudgetProgress } from "../services/budgetProgress";

export const budgetRouter = Router();
budgetRouter.use(requireAuth);

async function resolvePeriod(pool: sql.ConnectionPool, periodParam?: number) {
  if (periodParam !== undefined) {
    const result = await pool
      .request()
      .input("period", sql.SmallInt, periodParam)
      .query(`SELECT TOP 1 期, 開始年月 FROM ET0005期 WHERE 期 = @period`);
    return result.recordset[0];
  }
  const result = await pool.request().query(`
    SELECT TOP 1 期, 開始年月 FROM ET0005期 WHERE 現在 = '1' ORDER BY 期 DESC
  `);
  return result.recordset[0];
}

// repCode 未指定時は全担当者を合算した「全社計」を返す
budgetRouter.get("/budget/progress", async (req, res) => {
  const repCode = req.query.repCode ? Number(req.query.repCode) : undefined;
  if (req.query.repCode && !Number.isInteger(repCode)) {
    res.status(400).json({ message: "repCodeが不正です" });
    return;
  }
  const pool = await getReadonlyPool();

  const periodParam = req.query.period ? Number(req.query.period) : undefined;
  const periodRow = await resolvePeriod(pool, periodParam);
  if (!periodRow) {
    res.status(404).json({ message: "対象期が見つかりません" });
    return;
  }

  const budgetRequest = pool.request().input("period", sql.SmallInt, periodRow.期);
  const budgetColumns =
    repCode !== undefined
      ? BUDGET_MONTH_COLUMNS.map((c) => `[${c}]`).join(", ")
      : BUDGET_MONTH_COLUMNS.map((c) => `SUM([${c}]) AS [${c}]`).join(", ");
  if (repCode !== undefined) {
    budgetRequest.input("repCode", sql.SmallInt, repCode);
  }
  const budgetResult = await budgetRequest.query(`
    SELECT ${budgetColumns}
    FROM ET0170営業担当予算
    WHERE 期 = @period ${repCode !== undefined ? "AND 営業担当CD = @repCode" : ""}
  `);
  const budgetRow = budgetResult.recordset[0];
  if (!budgetRow) {
    res.status(404).json({ message: "予算データが見つかりません" });
    return;
  }

  const startDate = new Date(periodRow.開始年月);
  const endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 12, 1));

  const actualRequest = pool
    .request()
    .input("start", sql.SmallDateTime, startDate)
    .input("end", sql.SmallDateTime, endDate);
  let actualQuery: string;
  if (repCode !== undefined) {
    actualRequest.input("repCode", sql.SmallInt, repCode);
    actualQuery = `
      SELECT FORMAT(売上年月, 'yyyy-MM') AS month, 売上金額 AS salesAmount
      FROM ET0100担当者別売上
      WHERE 担当者CD = @repCode AND 売上年月 >= @start AND 売上年月 < @end
    `;
  } else {
    actualQuery = `
      SELECT FORMAT(売上年月, 'yyyy-MM') AS month, SUM(売上金額) AS salesAmount
      FROM ET0100担当者別売上
      WHERE 売上年月 >= @start AND 売上年月 < @end
      GROUP BY FORMAT(売上年月, 'yyyy-MM'), 売上年月
    `;
  }
  const actualResult = await actualRequest.query(actualQuery);
  const actualByMonth = new Map<string, number>(
    actualResult.recordset.map((r: { month: string; salesAmount: number }) => [r.month, r.salesAmount]),
  );

  const progress = computeBudgetProgress(startDate, budgetRow, actualByMonth, new Date());

  res.json({
    period: periodRow.期,
    repCode: repCode ?? null,
    ...progress,
  });
});
