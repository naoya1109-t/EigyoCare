import { apiFetch } from "./client";

export interface SalesTrendPoint {
  month: string;
  repCode: number | null;
  repName: string;
  salesAmount: number;
  grossProfit: number;
}

export interface PrefectureSalesRow {
  prefectureCode: number;
  prefectureName: string;
  salesAmount: number;
  grossProfit: number;
}

export interface SalesComparisonRow {
  repCode: number;
  repName: string;
  salesAmount: number;
  grossProfit: number;
}

export function fetchSalesByRep(repCode: string, months = 12): Promise<SalesTrendPoint[]> {
  const params = new URLSearchParams({ months: String(months) });
  if (repCode) params.set("repCode", repCode);
  return apiFetch<SalesTrendPoint[]>(`/sales/by-rep?${params.toString()}`);
}

export function fetchPrefectureMonths(): Promise<string[]> {
  return apiFetch<string[]>("/sales/prefecture-months");
}

export function fetchSalesByPrefecture(month: string): Promise<PrefectureSalesRow[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiFetch<PrefectureSalesRow[]>(`/sales/by-prefecture${query}`);
}

export function fetchSalesComparison(): Promise<SalesComparisonRow[]> {
  return apiFetch<SalesComparisonRow[]>("/sales/comparison");
}
