import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import { FilterForm, TextField } from "../../components/FilterForm";
import { fetchPayments, PaymentListItem } from "../../api/payments";
import { getCurrentUser } from "../../api/session";

export default function PaymentList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchPayments(search)
        .then(setRows)
        .catch(() => setError("入金確認の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const columns: Column<PaymentListItem>[] = [
    {
      key: "customerName",
      header: "得意先名",
      render: (row) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => navigate(`/payments/${row.customerCode}`)}
        >
          {row.customerName}
        </button>
      ),
    },
    { key: "currentInvoice", header: "今回請求", align: "right", render: (r) => r.currentInvoice.toLocaleString() },
    { key: "currentPayment", header: "今回入金", align: "right", render: (r) => r.currentPayment.toLocaleString() },
    { key: "previousInvoice", header: "前回請求", align: "right", render: (r) => r.previousInvoice.toLocaleString() },
    { key: "previousPayment", header: "前回入金", align: "right", render: (r) => r.previousPayment.toLocaleString() },
  ];

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">入金確認</h1>
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
