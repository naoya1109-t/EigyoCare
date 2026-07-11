import { apiFetch } from "./client";

export interface ReturnRow {
  lineNumber: number;
  saleDate: string;
  customerCode: number;
  customerName: string;
  item: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  remarks: string | null;
}

export function fetchReturns(customerCode: string): Promise<ReturnRow[]> {
  const query = customerCode ? `?customerCode=${encodeURIComponent(customerCode)}` : "";
  return apiFetch<ReturnRow[]>(`/returns${query}`);
}
