import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import DataTable, { Column } from "../../components/DataTable";
import {
  fetchCustomerDetail,
  fetchCustomerReceivables,
  CustomerDetail as CustomerDetailType,
  CustomerReceivableRow,
} from "../../api/customers";
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

function formatYearMonth(yearMonth: string): string {
  return yearMonth.length === 6 ? `${yearMonth.slice(0, 4)}-${yearMonth.slice(4)}` : yearMonth;
}

function formatZipCode(zipCode: string | null): string | null {
  if (!zipCode) return zipCode;
  return /^\d{7}$/.test(zipCode) ? `${zipCode.slice(0, 3)}-${zipCode.slice(3)}` : zipCode;
}

const COLLECTION_CYCLE_LABELS: Record<number, string> = {
  0: "当月",
  1: "翌月",
  2: "翌々月",
  3: "3ケ月",
  4: "4ケ月",
  5: "5ケ月",
  6: "6ケ月",
};

function formatClosingAndCollection(
  closingDay: number | null,
  collectionCycle: number | null,
  collectionDay: number | null,
): string | null {
  if (closingDay === null) return null;
  const closingText = closingDay === 31 ? "末日締" : `${closingDay}日締`;
  const cycleText = collectionCycle !== null ? COLLECTION_CYCLE_LABELS[collectionCycle] ?? String(collectionCycle) : "";
  const dayText = collectionDay !== null ? `${collectionDay}日` : "";
  const collectionText = [cycleText, dayText].filter(Boolean).join(" ");
  return [closingText, collectionText].filter(Boolean).join(" / ");
}

const receivableColumns: Column<CustomerReceivableRow>[] = [
  { key: "yearMonth", header: "年月", render: (r) => formatYearMonth(r.yearMonth) },
  { key: "paymentAmount", header: "入金額", align: "right", render: (r) => r.paymentAmount.toLocaleString() },
  { key: "salesAmount", header: "売上額", align: "right", render: (r) => r.salesAmount.toLocaleString() },
  { key: "balance", header: "売掛残", align: "right", render: (r) => r.balance.toLocaleString() },
];

export default function CustomerDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerDetailType | null>(null);
  const [receivables, setReceivables] = useState<CustomerReceivableRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetchCustomerDetail(code)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "取得に失敗しました"));
    fetchCustomerReceivables(code)
      .then(setReceivables)
      .catch(() => undefined);
  }, [code]);

  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <button className="mb-4 text-sm text-blue-600 hover:underline" onClick={() => navigate(-1)}>
        ← 顧客情報一覧へ戻る
      </button>
      <h1 className="mb-4 text-xl font-bold text-slate-800">顧客詳細</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !data && <p className="text-sm text-slate-500">読み込み中...</p>}
      {data && (
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-full max-w-[480px] rounded border border-slate-200 bg-white p-6">
            <Row label="得意先CD" value={data.customerCode} />
            <Row label="得意先名" value={data.customerName} />
            <Row label="フリガナ" value={data.customerNameKana} />
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
            <Row label="EMail" value={<MailLink email={data.email} />} />
            <Row label="担当者部署" value={data.contactDept} />
            <Row label="担当者役職" value={data.contactTitle} />
            <Row label="先方担当者名" value={data.contactName} />
            <Row label="営業担当" value={data.repName} />
            <Row
              label="締日/回収"
              value={formatClosingAndCollection(data.closingDay, data.collectionCycle, data.collectionDay)}
            />
            <Row label="最終購買日" value={data.lastPurchaseDate?.slice(0, 10) ?? null} />
            <Row label="最終入金日" value={data.lastPaymentDate?.slice(0, 10) ?? null} />
          </div>
          <div className="w-full max-w-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-600">売掛推移（直近12ヶ月）</h2>
            <DataTable
              columns={receivableColumns}
              rows={receivables}
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
