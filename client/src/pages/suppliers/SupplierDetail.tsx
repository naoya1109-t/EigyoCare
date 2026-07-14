import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import {
  fetchSupplierDetail,
  fetchSupplierPayables,
  SupplierDetail as SupplierDetailType,
  SupplierPayableRow,
} from "../../api/suppliers";
import { getCurrentUser } from "../../api/session";
import { ApiError } from "../../api/client";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex py-1 text-sm">
      <div className="w-24 shrink-0 border-b-2 border-[#799BC6] pb-1 text-slate-500">{label}</div>
      <div className="flex-1 whitespace-pre-wrap border-b-2 border-slate-300 pb-1 pl-3 text-slate-800">
        {value ?? "-"}
      </div>
    </div>
  );
}

function TelLink({ tel }: { tel: string | null }) {
  if (!tel) return <>-</>;
  return (
    <a href={`tel:${tel}`} className="text-blue-600 hover:underline">
      {tel}
    </a>
  );
}

function MailLink({ email }: { email: string | null }) {
  if (!email) return <>-</>;
  return (
    <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
      {email}
    </a>
  );
}

function formatZipCode(zipCode: string | null): string | null {
  if (!zipCode) return zipCode;
  return /^\d{7}$/.test(zipCode) ? `${zipCode.slice(0, 3)}-${zipCode.slice(3)}` : zipCode;
}

function HomepageLink({ url }: { url: string | null }) {
  if (!url) return <>-</>;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
      {url}
    </a>
  );
}

function formatYearMonth(yearMonth: string): string {
  return yearMonth.length === 6 ? `${yearMonth.slice(0, 4)}-${yearMonth.slice(4)}` : yearMonth;
}

const payableColumns: Column<SupplierPayableRow>[] = [
  { key: "yearMonth", header: "年月", render: (r) => formatYearMonth(r.yearMonth) },
  { key: "purchaseAmount", header: "仕入額", align: "right", render: (r) => r.purchaseAmount.toLocaleString() },
  { key: "discountAmount", header: "値引額", align: "right", render: (r) => r.discountAmount.toLocaleString() },
];

export default function SupplierDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierDetailType | null>(null);
  const [payables, setPayables] = useState<SupplierPayableRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetchSupplierDetail(code)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "取得に失敗しました"));
    fetchSupplierPayables(code)
      .then(setPayables)
      .catch(() => undefined);
  }, [code]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <button className="mb-4 text-sm text-blue-600 hover:underline" onClick={() => navigate(-1)}>
        ← 仕入先情報一覧へ戻る
      </button>
      <div className="mb-4 flex items-center gap-2">
        {data && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
            仕入先CD: {data.supplierCode}
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !data && <p className="text-sm text-slate-500">読み込み中...</p>}
      {data && (
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-full max-w-[480px] rounded border border-[#799BC6] bg-white px-4 py-3">
            <Row label="仕入先名" value={data.supplierName} />
            <Row label="フリガナ" value={data.supplierNameKana} />
            <Row label="郵便番号" value={formatZipCode(data.zipCode)} />
            <Row label="都道府県" value={data.prefecture} />
            <Row label="住所1" value={data.address1} />
            <Row label="住所2" value={data.address2} />
            <Row
              label="TEL / FAX"
              value={
                <>
                  <TelLink tel={data.tel} /> / {data.fax ?? "-"}
                </>
              }
            />
            <Row label="HP" value={<HomepageLink url={data.homepage} />} />
            <Row label="代表者氏名" value={data.representativeName} />
            <Row label="担当者部署" value={data.contactDept} />
            <Row label="担当者役職" value={data.contactTitle} />
            <Row label="担当者名" value={data.contactName} />
            <Row label="担当者TEL" value={<TelLink tel={data.contactTel} />} />
            <Row label="EMail" value={<MailLink email={data.email} />} />
            <Row label="備考" value={data.remarks} />
          </div>
          <div className="w-full max-w-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-600">買掛推移（直近12ヶ月）</h2>
            <DataTable
              columns={payableColumns}
              rows={payables}
              rowKey={(r) => r.yearMonth}
              theme={{
                border: "border-[#1C6836]",
                header: "bg-[#1C6836] text-white",
                oddRow: "bg-[#BEDFC0]",
                evenRow: "bg-white",
                rowHover: "hover:bg-[#a9d3ac]",
              }}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
