import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import DataTable, { Column } from "../components/DataTable";
import { fetchSalesComparison, SalesComparisonRow } from "../api/sales";
import { getCurrentUser } from "../api/session";

const columns: Column<SalesComparisonRow>[] = [
  { key: "repName", header: "担当者" },
  { key: "salesAmount", header: "売上金額", align: "right", render: (r) => r.salesAmount.toLocaleString() },
  { key: "grossProfit", header: "粗利金額", align: "right", render: (r) => r.grossProfit.toLocaleString() },
];

export default function SalesComparison() {
  const [rows, setRows] = useState<SalesComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesComparison()
      .then(setRows)
      .catch(() => setError("売上対比の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">担当者別売上対比（当月）</h1>
      <p className="mb-4 text-sm text-slate-500">
        直近の実績月における担当者ごとの売上・粗利を比較します。
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.repCode} />
      )}
    </AppLayout>
  );
}
