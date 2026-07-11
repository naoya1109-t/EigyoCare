export const BUDGET_MONTH_COLUMNS = [
  "10月", "11月", "12月", "1月", "2月", "3月",
  "4月", "5月", "6月", "7月", "8月", "9月",
];

export function addMonths(date: Date, n: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
}

export function toYearMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface MonthlyProgress {
  month: string;
  budgetAmount: number;
  actualAmount: number | null;
}

export interface BudgetProgressResult {
  monthly: MonthlyProgress[];
  totalBudget: number;
  totalActual: number;
  achievementRate: number;
}

/**
 * 期の開始年月（10月始まり）と予算行（10月〜9月のピボット列）、実績（年月→売上金額）から
 * 月別の予算・実績と、経過月（サーバー現在日時以前の月）のみを対象にした達成率を計算する。
 * 断片的な将来データ（バッチ処理途中の先行登録等）を「経過済み」と誤認しないよう、
 * 実績の有無ではなく暦月の前後関係で経過月を判定する。
 */
export function computeBudgetProgress(
  periodStartDate: Date,
  budgetRow: Record<string, number>,
  actualByMonth: Map<string, number>,
  now: Date,
): BudgetProgressResult {
  const currentYearMonth = toYearMonth(now);

  const monthly = BUDGET_MONTH_COLUMNS.map((col, i) => {
    const month = toYearMonth(addMonths(periodStartDate, i));
    return {
      month,
      budgetAmount: Number(budgetRow[col]),
      actualAmount: month <= currentYearMonth ? actualByMonth.get(month) ?? 0 : null,
    };
  });

  const elapsed = monthly.filter((m) => m.month <= currentYearMonth);
  const totalBudget = elapsed.reduce((sum, m) => sum + m.budgetAmount, 0);
  const totalActual = elapsed.reduce((sum, m) => sum + (m.actualAmount ?? 0), 0);
  const achievementRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return { monthly, totalBudget, totalActual, achievementRate };
}
