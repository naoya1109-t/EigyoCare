import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import { fetchInvoiceDetail, InvoiceDetail as InvoiceDetailType, InvoiceLine } from "../../api/invoices";
import { getCurrentUser } from "../../api/session";
import { ApiError } from "../../api/client";

const lineColumns: Column<InvoiceLine>[] = [
  { key: "saleDate", header: "売上日", render: (r) => r.saleDate.slice(0, 10) },
  {
    key: "item",
    header: "商品名",
    render: (r) => [r.item, r.spec?.trim()].filter((v) => v && v.length > 0).join(" / "),
  },
  { key: "quantity", header: "数量", align: "right" },
  { key: "unitPrice", header: "単価", align: "right", render: (r) => r.unitPrice?.toLocaleString() ?? "" },
  { key: "amount", header: "金額", align: "right", render: (r) => r.amount?.toLocaleString() ?? "" },
  { key: "remarks", header: "備考" },
];

export default function InvoiceDetail() {
  const { no } = useParams<{ no: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<InvoiceDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!no) return;
    fetchInvoiceDetail(no)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "取得に失敗しました"));
  }, [no]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <button className="mb-4 text-sm text-blue-600 hover:underline" onClick={() => navigate(-1)}>
        ← 請求情報一覧へ戻る
      </button>
      <h1 className="mb-4 text-xl font-bold text-slate-800">請求明細</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !data && <p className="text-sm text-slate-500">読み込み中...</p>}
      {data && (
        <>
          <div className="mb-4 grid max-w-xl grid-cols-2 gap-x-4 gap-y-1 rounded border border-slate-200 bg-white p-4 text-sm">
            <div className="text-slate-500">請求番号</div>
            <div>{data.invoiceNo}</div>
            <div className="text-slate-500">請求日</div>
            <div>{data.invoiceDate.slice(0, 10)}</div>
            <div className="text-slate-500">得意先</div>
            <div>{data.customerName}</div>
            <div className="text-slate-500">売上額</div>
            <div>{data.salesAmount.toLocaleString()}</div>
            <div className="text-slate-500">消費税額</div>
            <div>{data.taxAmount.toLocaleString()}</div>
            <div className="text-slate-500">今回請求残高</div>
            <div>{data.balance.toLocaleString()}</div>
          </div>
          <DataTable
            columns={lineColumns}
            rows={data.lines}
            rowKey={(r) => r.lineNumber}
            theme={{
              border: "border-[#E9A580]",
              header: "bg-[#DE6E34] text-white",
              oddRow: "bg-[#F9E1D4]",
              evenRow: "bg-white",
              rowHover: "hover:bg-[#f3cbb3]",
            }}
          />
        </>
      )}
    </AppLayout>
  );
}
