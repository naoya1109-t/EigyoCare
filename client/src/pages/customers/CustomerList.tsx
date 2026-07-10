import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import { FilterForm, TextField } from "../../components/FilterForm";
import { fetchCustomers, CustomerListItem } from "../../api/customers";
import { getCurrentUser } from "../../api/session";

const columns: Column<CustomerListItem>[] = [
  { key: "customerCode", header: "得意先CD" },
  { key: "customerName", header: "得意先名" },
  { key: "prefecture", header: "都道府県" },
  { key: "tel", header: "TEL" },
  { key: "repName", header: "担当者" },
];

export default function CustomerList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchCustomers(search)
        .then(setRows)
        .catch(() => setError("顧客情報の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">顧客情報</h1>
      <FilterForm>
        <TextField label="得意先名検索" value={search} onChange={setSearch} placeholder="得意先名またはカナ" />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable
          columns={columns.map((c) =>
            c.key === "customerName"
              ? {
                  ...c,
                  render: (row: CustomerListItem) => (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => navigate(`/customers/${row.customerCode}`)}
                    >
                      {row.customerName}
                    </button>
                  ),
                }
              : c,
          )}
          rows={rows}
          rowKey={(row) => row.customerCode}
        />
      )}
    </AppLayout>
  );
}
