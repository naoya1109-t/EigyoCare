import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import DataTable, { Column } from "../components/DataTable";
import { FilterForm, TextField } from "../components/FilterForm";
import { fetchReturns, ReturnRow } from "../api/returns";
import { getCurrentUser } from "../api/session";

const columns: Column<ReturnRow>[] = [
  { key: "saleDate", header: "日付", render: (r) => r.saleDate.slice(0, 10) },
  { key: "customerName", header: "得意先名" },
  { key: "item", header: "商品名" },
  { key: "quantity", header: "数量", align: "right" },
  { key: "amount", header: "金額", align: "right", render: (r) => r.amount?.toLocaleString() ?? "" },
];

export default function Returns() {
  const [customerCode, setCustomerCode] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchReturns(customerCode)
        .then(setRows)
        .catch(() => setError("返品情報の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [customerCode]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">返品</h1>
      <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        このデータは請求明細の区分コードから返品行を推測して抽出しています。区分の正式な定義は業務担当者への確認待ちです（詳細は
        functional-design.md 参照）。
      </p>
      <FilterForm>
        <TextField label="得意先コード" value={customerCode} onChange={setCustomerCode} placeholder="例: 1" />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.lineNumber} />
      )}
    </AppLayout>
  );
}
