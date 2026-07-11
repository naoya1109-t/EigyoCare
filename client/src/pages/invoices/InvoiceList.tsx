import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import { FilterForm, TextField } from "../../components/FilterForm";
import { fetchInvoices, InvoiceListItem } from "../../api/invoices";
import { getCurrentUser } from "../../api/session";

export default function InvoiceList() {
  const navigate = useNavigate();
  const [customerCode, setCustomerCode] = useState("");
  const [rows, setRows] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchInvoices(customerCode)
        .then(setRows)
        .catch(() => setError("請求情報の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [customerCode]);

  const columns: Column<InvoiceListItem>[] = [
    {
      key: "invoiceNo",
      header: "請求番号",
      render: (row) => (
        <button className="text-blue-600 hover:underline" onClick={() => navigate(`/invoices/${row.invoiceNo}`)}>
          {row.invoiceNo}
        </button>
      ),
    },
    { key: "invoiceDate", header: "請求日", render: (row) => row.invoiceDate.slice(0, 10) },
    { key: "customerName", header: "得意先名" },
    { key: "salesAmount", header: "売上額", align: "right", render: (row) => row.salesAmount.toLocaleString() },
    { key: "balance", header: "今回請求残高", align: "right", render: (row) => row.balance.toLocaleString() },
  ];

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">請求情報</h1>
      <FilterForm>
        <TextField label="得意先コード" value={customerCode} onChange={setCustomerCode} placeholder="例: 1" />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.invoiceNo} />
      )}
    </AppLayout>
  );
}
