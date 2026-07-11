import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import TrendChart from "../components/TrendChart";
import { FilterForm, SelectField } from "../components/FilterForm";
import { fetchSalesByPrefecture, fetchPrefectureMonths, PrefectureSalesRow } from "../api/sales";
import { getCurrentUser } from "../api/session";

type SortOrder = "salesDesc" | "prefectureCode";

export default function SalesByPrefecture() {
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState("");
  const [data, setData] = useState<PrefectureSalesRow[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("salesDesc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedData = [...data].sort((a, b) =>
    sortOrder === "prefectureCode"
      ? a.prefectureCode - b.prefectureCode
      : b.salesAmount - a.salesAmount,
  );

  useEffect(() => {
    fetchPrefectureMonths().then((list) => {
      setMonths(list);
      if (list.length > 0) setMonth(list[0]);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    fetchSalesByPrefecture(month)
      .then(setData)
      .catch(() => setError("県別売上の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">県別売上推移</h1>
      <p className="mb-4 text-sm text-slate-500">対象月における都道府県別の売上・粗利を比較します。</p>
      <FilterForm>
        <SelectField
          label="対象年月"
          value={month}
          onChange={setMonth}
          options={months.map((m) => ({ value: m, label: m }))}
        />
        <SelectField
          label="並び順"
          value={sortOrder}
          onChange={(v) => setSortOrder(v as SortOrder)}
          options={[
            { value: "salesDesc", label: "売上金額順" },
            { value: "prefectureCode", label: "県CD順" },
          ]}
        />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <div className="rounded border border-slate-200 bg-white p-4">
          <TrendChart
            data={sortedData}
            xKey="prefectureName"
            type="bar"
            orientation="horizontal"
            height={Math.max(400, data.length * 28)}
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
