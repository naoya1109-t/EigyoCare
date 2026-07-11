import { apiFetch } from "./client";

export interface DiscountRow {
  lineNumber: number;
  saleDate: string;
  customerCode: number;
  customerName: string;
  item: string | null;
  amount: number | null;
  remarks: string | null;
}

export function fetchDiscounts(customerCode: string): Promise<DiscountRow[]> {
  const query = customerCode ? `?customerCode=${encodeURIComponent(customerCode)}` : "";
  return apiFetch<DiscountRow[]>(`/discounts${query}`);
}
