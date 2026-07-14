import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { fetchPaymentDetail, PaymentDetail as PaymentDetailType } from "../../api/payments";
import { getCurrentUser } from "../../api/session";
import { ApiError } from "../../api/client";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex border-b border-slate-100 py-2 text-sm">
      <div className="w-32 shrink-0 text-slate-500">{label}</div>
      <div className="text-slate-800">{value ?? "-"}</div>
    </div>
  );
}

export default function PaymentDetail() {
  const { customerCode } = useParams<{ customerCode: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PaymentDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerCode) return;
    fetchPaymentDetail(customerCode)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "取得に失敗しました"));
  }, [customerCode]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <button className="mb-4 text-sm text-blue-600 hover:underline" onClick={() => navigate(-1)}>
        ← 入金確認一覧へ戻る
      </button>
      <h1 className="mb-4 text-xl font-bold text-slate-800">入金確認詳細</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !data && <p className="text-sm text-slate-500">読み込み中...</p>}
      {data && (
        <div className="max-w-xl rounded border border-slate-200 bg-white p-6">
          <Row label="得意先" value={data.customerName} />
          <Row
            label="支払期日"
            value={
              data.isOverdue ? (
                <span className="font-semibold text-red-600">{data.dueDate?.slice(0, 10)}（期限切れ）</span>
              ) : (
                (data.dueDate?.slice(0, 10) ?? null)
              )
            }
          />
          <Row label="未入金額" value={data.outstandingAmount.toLocaleString()} />
          <Row label="今回請求" value={data.currentInvoice.toLocaleString()} />
          <Row label="今回入金" value={data.currentPayment.toLocaleString()} />
          <Row label="前回請求" value={data.previousInvoice.toLocaleString()} />
          <Row label="前回入金" value={data.previousPayment.toLocaleString()} />
          <Row label="前々回請求" value={data.twoAgoInvoice.toLocaleString()} />
          <Row label="前々回入金" value={data.twoAgoPayment.toLocaleString()} />
          <Row label="前々々回請求" value={data.threeAgoInvoice.toLocaleString()} />
          <Row label="前々々回入金" value={data.threeAgoPayment.toLocaleString()} />
          <Row label="請求後入金" value={data.afterInvoicePayment.toLocaleString()} />
          <Row label="前回請求締日" value={data.previousClosingDate?.slice(0, 10) ?? null} />
        </div>
      )}
    </AppLayout>
  );
}
