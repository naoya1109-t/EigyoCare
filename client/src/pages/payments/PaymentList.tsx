import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import { FilterForm, TextField, SelectField } from "../../components/FilterForm";
import { fetchPayments, PaymentListItem } from "../../api/payments";
import { fetchReps, Rep } from "../../api/reference";
import { getCurrentUser } from "../../api/session";

export default function PaymentList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [showAll, setShowAll] = useState(searchParams.get("all") === "true");
  const [repCode, setRepCode] = useState(searchParams.get("repCode") ?? "");
  const [reps, setReps] = useState<Rep[]>([]);
  const [rows, setRows] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReps().then(setReps).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (showAll) params.all = "true";
      if (repCode) params.repCode = repCode;
      setSearchParams(params, { replace: true });

      fetchPayments({ search, showAll, repCode })
        .then(setRows)
        .catch(() => setError("入金確認の取得に失敗しました"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showAll, repCode]);

  const columns: Column<PaymentListItem>[] = [
    { key: "customerCode", header: "得意先CD" },
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
    { key: "repName", header: "担当者", render: (r) => r.repName ?? "-" },
    { key: "dueDate", header: "支払期日", render: (r) => r.dueDate?.slice(0, 10) ?? "-" },
    { key: "invoiceAmount", header: "請求額", align: "right", render: (r) => r.invoiceAmount.toLocaleString() },
    {
      key: "paymentReceived",
      header: "入金額",
      align: "right",
      render: (r) => r.paymentReceived.toLocaleString(),
    },
    {
      key: "outstandingAmount",
      header: "未入金額",
      align: "right",
      render: (r) => r.outstandingAmount.toLocaleString(),
    },
  ];

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <h1 className="mb-4 text-xl font-bold text-slate-800">
        入金確認{showAll ? "" : "（未入金・期限切れのみ）"}
      </h1>
      <FilterForm>
        <TextField label="得意先名検索" value={search} onChange={setSearch} />
        <SelectField
          label="担当者"
          value={repCode}
          onChange={setRepCode}
          options={[
            { value: "", label: "すべて" },
            ...reps.map((r) => ({ value: String(r.repCode), label: r.repName })),
          ]}
        />
        <label className="flex items-center gap-2 pb-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          全件表示
        </label>
      </FilterForm>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.customerCode}
          rowClassName={(r) => (r.isOverdue ? "text-red-600 font-semibold" : "")}
          emptyMessage={showAll ? "データがありません" : "期限切れの未入金はありません"}
        />
      )}
    </AppLayout>
  );
}
