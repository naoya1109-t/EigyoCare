import { apiFetch } from "./client";

export interface ReceivableRow {
  customerCode: number;
  customerName: string;
  yearMonth: string;
  salesAmount: number;
  paymentAmount: number;
  balance: number;
}

export function fetchReceivables(search: string): Promise<ReceivableRow[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<ReceivableRow[]>(`/receivables${query}`);
}
