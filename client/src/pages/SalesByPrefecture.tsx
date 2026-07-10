import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import TrendChart from "../components/TrendChart";
import { FilterForm, SelectField } from "../components/FilterForm";
import { fetchSalesByPrefecture, PrefectureSalesTrendPoint } from "../api/sales";
import { fetchPrefectures, Prefecture } from "../api/reference";
import { getCurrentUser } from "../api/session";

export default function SalesByPrefecture() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [prefectureCode, setPrefectureCode] = useState("");
  const [data, setData] = useState<PrefectureSalesTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrefectures().then(setPrefectures).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSalesByPrefecture(prefectureCode, 12)
      .then(setData)
      .catch(() => setError("売上推移の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [prefectureCode]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">県別売上推移</h1>
      <FilterForm>
        <SelectField
          label="都道府県"
          value={prefectureCode}
          onChange={setPrefectureCode}
          options={[
            { value: "", label: "全国計" },
            ...prefectures.map((p) => ({ value: String(p.prefectureCode), label: p.prefectureName })),
          ]}
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
