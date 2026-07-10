import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { fetchSupplierDetail, SupplierDetail as SupplierDetailType } from "../../api/suppliers";
import { getCurrentUser } from "../../api/session";
import { ApiError } from "../../api/client";

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex border-b border-slate-100 py-2 text-sm">
      <div className="w-32 shrink-0 text-slate-500">{label}</div>
      <div className="whitespace-pre-wrap text-slate-800">{value ?? "-"}</div>
    </div>
  );
}

export default function SupplierDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetchSupplierDetail(code)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "取得に失敗しました"));
  }, [code]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <button className="mb-4 text-sm text-blue-600 hover:underline" onClick={() => navigate("/suppliers")}>
        ← 仕入先情報一覧へ戻る
      </button>
      <h1 className="mb-4 text-xl font-bold text-slate-800">仕入先詳細</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !data && <p className="text-sm text-slate-500">読み込み中...</p>}
      {data && (
        <div className="max-w-xl rounded border border-slate-200 bg-white p-6">
          <Row label="仕入先CD" value={data.supplierCode} />
          <Row label="仕入先名" value={data.supplierName} />
          <Row label="フリガナ" value={data.supplierNameKana} />
          <Row label="郵便番号" value={data.zipCode} />
          <Row label="都道府県" value={data.prefecture} />
          <Row label="住所1" value={data.address1} />
          <Row label="住所2" value={data.address2} />
          <Row label="TEL" value={data.tel} />
          <Row label="FAX" value={data.fax} />
          <Row label="HP" value={data.homepage} />
          <Row label="代表者氏名" value={data.representativeName} />
          <Row label="担当者部署" value={data.contactDept} />
          <Row label="担当者役職" value={data.contactTitle} />
          <Row label="担当者名" value={data.contactName} />
          <Row label="担当者TEL" value={data.contactTel} />
          <Row label="EMail" value={data.email} />
          <Row label="備考" value={data.remarks} />
        </div>
      )}
    </AppLayout>
  );
}
