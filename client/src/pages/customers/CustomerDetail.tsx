import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { fetchCustomerDetail, CustomerDetail as CustomerDetailType } from "../../api/customers";
import { getCurrentUser } from "../../api/session";
import { ApiError } from "../../api/client";

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex border-b border-slate-100 py-2 text-sm">
      <div className="w-32 shrink-0 text-slate-500">{label}</div>
      <div className="text-slate-800">{value ?? "-"}</div>
    </div>
  );
}

export default function CustomerDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetchCustomerDetail(code)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "取得に失敗しました"));
  }, [code]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <button className="mb-4 text-sm text-blue-600 hover:underline" onClick={() => navigate("/customers")}>
        ← 顧客情報一覧へ戻る
      </button>
      <h1 className="mb-4 text-xl font-bold text-slate-800">顧客詳細</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !data && <p className="text-sm text-slate-500">読み込み中...</p>}
      {data && (
        <div className="max-w-xl rounded border border-slate-200 bg-white p-6">
          <Row label="得意先CD" value={data.customerCode} />
          <Row label="得意先名" value={data.customerName} />
          <Row label="フリガナ" value={data.customerNameKana} />
          <Row label="郵便番号" value={data.zipCode} />
          <Row label="都道府県" value={data.prefecture} />
          <Row label="住所1" value={data.address1} />
          <Row label="住所2" value={data.address2} />
          <Row label="TEL" value={data.tel} />
          <Row label="FAX" value={data.fax} />
          <Row label="EMail" value={data.email} />
          <Row label="担当者部署" value={data.contactDept} />
          <Row label="担当者役職" value={data.contactTitle} />
          <Row label="先方担当者名" value={data.contactName} />
          <Row label="営業担当" value={data.repName} />
          <Row label="締日" value={data.closingDay} />
          <Row label="最終購買日" value={data.lastPurchaseDate?.slice(0, 10) ?? null} />
          <Row label="最終入金日" value={data.lastPaymentDate?.slice(0, 10) ?? null} />
        </div>
      )}
    </AppLayout>
  );
}
