import { apiFetch } from "./client";

export interface BudgetMonthly {
  month: string;
  budgetAmount: number;
  actualAmount: number | null;
}

export interface BudgetProgress {
  period: number;
  repCode: number;
  monthly: BudgetMonthly[];
  totalBudget: number;
  totalActual: number;
  achievementRate: number;
}

export function fetchBudgetProgress(repCode: string): Promise<BudgetProgress> {
  return apiFetch<BudgetProgress>(`/budget/progress?repCode=${encodeURIComponent(repCode)}`);
}
