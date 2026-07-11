import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const budgetRouter = Router();
budgetRouter.use(requireAuth);

const BUDGET_MONTH_COLUMNS = [
  "10月", "11月", "12月", "1月", "2月", "3月",
  "4月", "5月", "6月", "7月", "8月", "9月",
];

function addMonths(date: Date, n: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
  return d;
}

function toYearMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

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
  const monthlyBudget = BUDGET_MONTH_COLUMNS.map((col, i) => ({
    month: toYearMonth(addMonths(startDate, i)),
    budgetAmount: Number(budgetRow[col]),
  }));

  const actualResult = await pool
    .request()
    .input("repCode", sql.SmallInt, repCode)
    .input("start", sql.SmallDateTime, startDate)
    .input("end", sql.SmallDateTime, addMonths(startDate, 12))
    .query(`
      SELECT FORMAT(売上年月, 'yyyy-MM') AS month, 売上金額 AS salesAmount
      FROM ET0100担当者別売上
      WHERE 担当者CD = @repCode AND 売上年月 >= @start AND 売上年月 < @end
    `);
  const actualByMonth = new Map<string, number>(
    actualResult.recordset.map((r: { month: string; salesAmount: number }) => [r.month, r.salesAmount]),
  );

  // 将来月にも断片的な実績行が紛れ込むことがある（バッチ処理途中のデータ等）ため、
  // 実績の有無ではなく「サーバーの現在日時以前の月かどうか」で経過月を判定する
  const currentYearMonth = toYearMonth(new Date());
  const monthly = monthlyBudget.map((m) => ({
    month: m.month,
    budgetAmount: m.budgetAmount,
    actualAmount: m.month <= currentYearMonth ? actualByMonth.get(m.month) ?? 0 : null,
  }));

  const elapsed = monthly.filter((m) => m.month <= currentYearMonth);
  const totalBudget = elapsed.reduce((sum, m) => sum + m.budgetAmount, 0);
  const totalActual = elapsed.reduce((sum, m) => sum + (m.actualAmount ?? 0), 0);
  const achievementRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  res.json({
    period: periodRow.期,
    repCode,
    monthly,
    totalBudget,
    totalActual,
    achievementRate,
  });
});
