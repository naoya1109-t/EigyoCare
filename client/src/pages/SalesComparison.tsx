import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import DataTable, { Column } from "../components/DataTable";
import { FilterForm, SelectField } from "../components/FilterForm";
import { fetchSalesComparison, ComparisonMode, SalesComparisonRow } from "../api/sales";
import { getCurrentUser } from "../api/session";

const MODE_OPTIONS: { value: ComparisonMode; label: string }[] = [
  { value: "sales", label: "売上比較" },
  { value: "profit", label: "粗利比較" },
  { value: "margin", label: "粗利率比較" },
];

function formatValue(value: number | null, mode: ComparisonMode): string {
  if (value === null) return "-";
  return mode === "margin" ? `${(value * 100).toFixed(2)}%` : value.toLocaleString();
}

export default function SalesComparison() {
  const [mode, setMode] = useState<ComparisonMode>("sales");
  const [rows, setRows] = useState<SalesComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSalesComparison(mode)
      .then(setRows)
      .catch(() => setError("売上対比の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [mode]);

  const columns: Column<SalesComparisonRow>[] = [
    { key: "repName", header: "担当者" },
    { key: "current", header: "今期", align: "right", render: (r) => formatValue(r.current, mode) },
    { key: "prior", header: "前期", align: "right", render: (r) => formatValue(r.prior, mode) },
    { key: "ratio", header: "比率", align: "right", render: (r) => `${r.ratio.toFixed(1)}%` },
  ];

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">担当者別売上対比</h1>
      <p className="mb-4 text-sm text-slate-500">当月1日から当日までの実績を、前年同期間と比較します。</p>
      <FilterForm>
        <SelectField
          label="比較対象"
          value={mode}
          onChange={(v) => setMode(v as ComparisonMode)}
          options={MODE_OPTIONS}
        />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.repCode} />
      )}
    </AppLayout>
  );
}
