import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import TrendChart from "../components/TrendChart";
import ProgressGauge from "../components/ProgressGauge";
import { FilterForm, SelectField } from "../components/FilterForm";
import { fetchBudgetProgress, BudgetProgress as BudgetProgressType, BudgetMonthly } from "../api/budget";
import { fetchReps, Rep } from "../api/reference";
import { getCurrentUser } from "../api/session";
import { ApiError } from "../api/client";

export default function BudgetProgress() {
  const [reps, setReps] = useState<Rep[]>([]);
  const [repCode, setRepCode] = useState("");
  const [data, setData] = useState<BudgetProgressType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReps().then((r) => {
      setReps(r);
      if (r.length > 0) setRepCode(String(r[0].repCode));
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!repCode) return;
    setError(null);
    fetchBudgetProgress(repCode)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "予算進捗の取得に失敗しました"));
  }, [repCode]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">担当者別予算進捗</h1>
      <FilterForm>
        <SelectField
          label="担当者"
          value={repCode}
          onChange={setRepCode}
          options={reps.map((r) => ({ value: String(r.repCode), label: r.repName }))}
        />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white p-4">
            <ProgressGauge value={data.achievementRate} label="予算達成率（経過月分）" />
          </div>
          <div className="rounded border border-slate-200 bg-white p-4 md:col-span-2">
            <TrendChart
              data={data.monthly}
              xKey="month"
              type="bar"
              series={[
                { key: "budgetAmount", label: "予算", color: "#94a3b8" },
                { key: "actualAmount", label: "実績", color: "#2563eb" },
              ]}
              renderTooltipExtra={(row: BudgetMonthly) => {
                if (row.actualAmount === null || row.budgetAmount === 0) return null;
                const rate = (row.actualAmount / row.budgetAmount) * 100;
                return <div className="mt-1 font-semibold text-slate-700">達成率: {rate.toFixed(1)}%</div>;
              }}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
