import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import TrendChart from "../components/TrendChart";
import { FilterForm, SelectField } from "../components/FilterForm";
import { fetchSalesByRep, SalesTrendPoint } from "../api/sales";
import { fetchReps, Rep } from "../api/reference";
import { getCurrentUser } from "../api/session";

export default function SalesByRep() {
  const [reps, setReps] = useState<Rep[]>([]);
  const [repCode, setRepCode] = useState("");
  const [data, setData] = useState<SalesTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReps().then(setReps).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSalesByRep(repCode, 12)
      .then(setData)
      .catch(() => setError("売上推移の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [repCode]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">担当者別売上推移</h1>
      <FilterForm>
        <SelectField
          label="担当者"
          value={repCode}
          onChange={setRepCode}
          options={[{ value: "", label: "全社計" }, ...reps.map((r) => ({ value: String(r.repCode), label: r.repName }))]}
        />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <div className="rounded border border-slate-200 bg-white p-4">
          <TrendChart
            data={data}
            xKey="month"
            series={[
              { key: "salesAmount", label: "売上金額", color: "#2563eb" },
              { key: "grossProfit", label: "粗利金額", color: "#16a34a" },
            ]}
          />
        </div>
      )}
    </AppLayout>
  );
}
