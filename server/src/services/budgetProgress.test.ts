import { describe, it, expect } from "vitest";
import { computeBudgetProgress, toYearMonth, addMonths, BUDGET_MONTH_COLUMNS } from "./budgetProgress";

function budgetRow(amountPerMonth: number): Record<string, number> {
  return Object.fromEntries(BUDGET_MONTH_COLUMNS.map((c) => [c, amountPerMonth]));
}

describe("toYearMonth / addMonths", () => {
  it("formats a UTC date as yyyy-MM", () => {
    expect(toYearMonth(new Date(Date.UTC(2025, 9, 1)))).toBe("2025-10");
  });

  it("adds months across a year boundary", () => {
    const start = new Date(Date.UTC(2025, 9, 1)); // 2025-10
    expect(toYearMonth(addMonths(start, 3))).toBe("2026-01");
  });
});

describe("computeBudgetProgress", () => {
  const periodStart = new Date(Date.UTC(2025, 9, 1)); // fiscal year starting 2025-10

  it("only counts months up to the current month as elapsed, ignoring stray future rows", () => {
    const actualByMonth = new Map<string, number>([
      ["2025-10", 100],
      ["2025-11", 100],
      // 断片的な将来データが紛れ込んでいても、経過月でなければ無視されるべき
      ["2026-08", 5],
      ["2026-09", 3],
    ]);
    const now = new Date(Date.UTC(2025, 10, 15)); // 2025-11-15: 2 months elapsed

    const result = computeBudgetProgress(periodStart, budgetRow(100), actualByMonth, now);

    expect(result.totalBudget).toBe(200); // 2 elapsed months x 100
    expect(result.totalActual).toBe(200);
    expect(result.achievementRate).toBeCloseTo(100);

    const august = result.monthly.find((m) => m.month === "2026-08");
    expect(august?.actualAmount).toBeNull();
  });

  it("treats an elapsed month with no actual row as zero, not missing", () => {
    const now = new Date(Date.UTC(2025, 10, 15));
    const result = computeBudgetProgress(periodStart, budgetRow(100), new Map(), now);

    const october = result.monthly.find((m) => m.month === "2025-10");
    expect(october?.actualAmount).toBe(0);
    expect(result.achievementRate).toBe(0);
  });

  it("returns achievementRate 0 when no months have elapsed yet", () => {
    const now = new Date(Date.UTC(2025, 8, 1)); // before the fiscal year starts
    const result = computeBudgetProgress(periodStart, budgetRow(100), new Map(), now);
    expect(result.totalBudget).toBe(0);
    expect(result.achievementRate).toBe(0);
  });

  describe("priorMonthsAchievementRate", () => {
    it("is null when viewed in the fiscal year's first month (no prior month exists)", () => {
      const now = new Date(Date.UTC(2025, 9, 15)); // 2025-10-15: fiscal year just started
      const result = computeBudgetProgress(periodStart, budgetRow(100), new Map(), now);
      expect(result.priorMonthsAchievementRate).toBeNull();
    });

    it("excludes the current (possibly incomplete) month from the rate", () => {
      const actualByMonth = new Map<string, number>([
        ["2025-10", 100], // full prior month, on target
        ["2025-11", 5], // current month, partial so far
      ]);
      const now = new Date(Date.UTC(2025, 10, 3)); // 2025-11-03
      const result = computeBudgetProgress(periodStart, budgetRow(100), actualByMonth, now);

      // achievementRate (including current month) would be dragged down by the partial November data
      expect(result.achievementRate).toBeCloseTo(52.5); // (100+5)/200*100
      // priorMonthsAchievementRate only looks at October, which hit its budget exactly
      expect(result.priorMonthsAchievementRate).toBeCloseTo(100);
    });

    it("is 0, not null, when a prior month exists but had no sales", () => {
      const now = new Date(Date.UTC(2025, 10, 15)); // 2025-11-15
      const result = computeBudgetProgress(periodStart, budgetRow(100), new Map(), now);
      expect(result.priorMonthsAchievementRate).toBe(0);
    });
  });
});
