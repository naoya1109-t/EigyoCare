import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import DataTable, { Column } from "../components/DataTable";
import { FilterForm, TextField } from "../components/FilterForm";
import { fetchReceivables, ReceivableRow } from "../api/receivables";
import { getCurrentUser } from "../api/session";

const columns: Column<ReceivableRow>[] = [
  { key: "customerName", header: "得意先名" },
  { key: "yearMonth", header: "対象年月" },
  { key: "balance", header: "売掛金残高", align: "right", render: (r) => r.balance.toLocaleString() },
];

export default function Receivables() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ReceivableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchReceivables(search)
        .then(setRows)
        .catch(() => setError("売掛金一覧の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">売掛金一覧</h1>
      <FilterForm>
        <TextField label="得意先名検索" value={search} onChange={setSearch} />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.customerCode} />
      )}
    </AppLayout>
  );
}
