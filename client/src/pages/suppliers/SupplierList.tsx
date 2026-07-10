import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import { FilterForm, TextField } from "../../components/FilterForm";
import { fetchSuppliers, SupplierListItem } from "../../api/suppliers";
import { getCurrentUser } from "../../api/session";

const columns: Column<SupplierListItem>[] = [
  { key: "supplierCode", header: "仕入先CD" },
  { key: "supplierName", header: "仕入先名" },
  { key: "prefecture", header: "都道府県" },
  { key: "tel", header: "TEL" },
];

export default function SupplierList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<SupplierListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchSuppliers(search)
        .then(setRows)
        .catch(() => setError("仕入先情報の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">仕入先情報</h1>
      <FilterForm>
        <TextField label="仕入先名検索" value={search} onChange={setSearch} placeholder="仕入先名またはカナ" />
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable
          columns={columns.map((c) =>
            c.key === "supplierName"
              ? {
                  ...c,
                  render: (row: SupplierListItem) => (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => navigate(`/suppliers/${row.supplierCode}`)}
                    >
                      {row.supplierName}
                    </button>
                  ),
                }
              : c,
          )}
          rows={rows}
          rowKey={(row) => row.supplierCode}
        />
      )}
    </AppLayout>
  );
}
