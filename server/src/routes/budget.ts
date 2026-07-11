import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";
import { BUDGET_MONTH_COLUMNS, computeBudgetProgress } from "../services/budgetProgress";

export const budgetRouter = Router();
budgetRouter.use(requireAuth);

budgetRouter.get("/budget/progress", async (req, res) => {
  const repCode = Number(req.query.repCode);
  if (!Number.isInteger(repCode)) {
    res.status(400).json({ message: "repCodeを指定してください" });
    return;
  }
  const pool = await getReadonlyPool();

  const periodParam = req.query.period ? Number(req.query.period) : undefined;
  const periodResult = await pool
    .request()
    .input("period", sql.SmallInt, periodParam ?? null)
    .query(`
      SELECT TOP 1 期, 開始年月 FROM ET0005期
      WHERE (@period IS NOT NULL AND 期 = @period) OR (@period IS NULL AND 現在 = '1')
      ORDER BY 期 DESC
    `);
  const periodRow = periodResult.recordset[0];
  if (!periodRow) {
    res.status(404).json({ message: "対象期が見つかりません" });
    return;
  }

  const budgetResult = await pool
    .request()
    .input("period", sql.SmallInt, periodRow.期)
    .input("repCode", sql.SmallInt, repCode)
    .query(`
      SELECT ${BUDGET_MONTH_COLUMNS.map((c) => `[${c}]`).join(", ")}
      FROM ET0170営業担当予算
      WHERE 期 = @period AND 営業担当CD = @repCode
    `);
  const budgetRow = budgetResult.recordset[0];
  if (!budgetRow) {
    res.status(404).json({ message: "予算データが見つかりません" });
    return;
  }

  const startDate = new Date(periodRow.開始年月);

  const actualResult = await pool
    .request()
    .input("repCode", sql.SmallInt, repCode)
    .input("start", sql.SmallDateTime, startDate)
    .input("end", sql.SmallDateTime, new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 12, 1)))
    .query(`
      SELECT FORMAT(売上年月, 'yyyy-MM') AS month, 売上金額 AS salesAmount
      FROM ET0100担当者別売上
      WHERE 担当者CD = @repCode AND 売上年月 >= @start AND 売上年月 < @end
    `);
  const actualByMonth = new Map<string, number>(
    actualResult.recordset.map((r: { month: string; salesAmount: number }) => [r.month, r.salesAmount]),
  );

  const progress = computeBudgetProgress(startDate, budgetRow, actualByMonth, new Date());

  res.json({
    period: periodRow.期,
    repCode,
    ...progress,
  });
});
