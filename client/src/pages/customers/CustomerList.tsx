import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import { FilterForm, TextField, SelectField } from "../../components/FilterForm";
import { fetchCustomers, CustomerListItem } from "../../api/customers";
import { fetchPrefectures, fetchReps, Prefecture, Rep } from "../../api/reference";
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
  const [prefectureCode, setPrefectureCode] = useState("");
  const [repCode, setRepCode] = useState("");
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [rows, setRows] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrefectures().then(setPrefectures).catch(() => undefined);
    fetchReps().then(setReps).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchCustomers({ search, prefectureCode, repCode })
        .then(setRows)
        .catch(() => setError("顧客情報の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, prefectureCode, repCode]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">顧客情報</h1>
      <FilterForm>
        <TextField label="得意先名検索" value={search} onChange={setSearch} placeholder="得意先名またはカナ" />
        <SelectField
          label="都道府県"
          value={prefectureCode}
          onChange={setPrefectureCode}
          options={[
            { value: "", label: "すべて" },
            ...prefectures.map((p) => ({ value: String(p.prefectureCode), label: p.prefectureName })),
          ]}
        />
        <SelectField
          label="担当者"
          value={repCode}
          onChange={setRepCode}
          options={[
            { value: "", label: "すべて" },
            ...reps.map((r) => ({ value: String(r.repCode), label: r.repName })),
          ]}
        />
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
