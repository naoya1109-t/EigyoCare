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
  const [repsLoaded, setRepsLoaded] = useState(false);
  const [repCode, setRepCode] = useState("");
  const [data, setData] = useState<BudgetProgressType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReps()
      .then(setReps)
      .finally(() => setRepsLoaded(true));
  }, []);

  useEffect(() => {
    if (!repsLoaded) return;
    setError(null);
    fetchBudgetProgress(repCode)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "予算進捗の取得に失敗しました"));
  }, [repCode, repsLoaded]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">担当者別予算進捗</h1>
      <FilterForm>
        <SelectField
          label="担当者"
          value={repCode}
          onChange={setRepCode}
          options={[
            { value: "", label: "全社計" },
            ...reps.map((r) => ({ value: String(r.repCode), label: r.repName })),
          ]}
        />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap justify-center gap-2">
              {data.priorMonthsAchievementRate === null ? (
                <div className="flex w-[140px] flex-col items-center justify-center text-center text-sm text-slate-400">
                  <span>予算達成率</span>
                  <span>（前月まで）</span>
                  <span className="mt-2">集計対象月なし</span>
                </div>
              ) : (
                <ProgressGauge
                  value={data.priorMonthsAchievementRate}
                  label="予算達成率（前月まで）"
                  size={140}
                  hoverDetails={
                    <div className="space-y-0.5">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">予算計</span>
                        <span className="font-semibold text-slate-800">
                          {data.totalBudgetPrior.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">実績計</span>
                        <span className="font-semibold text-slate-800">
                          {data.totalActualPrior.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  }
                />
              )}
              <ProgressGauge value={data.achievementRate} label="予算達成率（経過月分）" size={140} />
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">予算計（経過月分）</span>
                <span className="font-semibold text-slate-800">{data.totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">実績計（経過月分）</span>
                <span className="font-semibold text-slate-800">{data.totalActual.toLocaleString()}</span>
              </div>
            </div>
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
