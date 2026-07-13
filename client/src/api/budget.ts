import { apiFetch } from "./client";

export interface BudgetMonthly {
  month: string;
  budgetAmount: number;
  actualAmount: number | null;
}

export interface BudgetProgress {
  period: number;
  repCode: number | null;
  monthly: BudgetMonthly[];
  totalBudget: number;
  totalActual: number;
  achievementRate: number;
  priorMonthsAchievementRate: number | null;
  totalBudgetPrior: number;
  totalActualPrior: number;
}

export function fetchBudgetProgress(repCode: string): Promise<BudgetProgress> {
  const query = repCode ? `?repCode=${encodeURIComponent(repCode)}` : "";
  return apiFetch<BudgetProgress>(`/budget/progress${query}`);
}
