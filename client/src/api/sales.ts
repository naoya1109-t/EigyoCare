import { apiFetch } from "./client";

export interface SalesTrendPoint {
  month: string;
  repCode: number | null;
  repName: string;
  salesAmount: number;
  grossProfit: number;
}

export interface PrefectureSalesTrendPoint {
  month: string;
  prefectureCode: number | null;
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

export function fetchSalesByPrefecture(
  prefectureCode: string,
  months = 12,
): Promise<PrefectureSalesTrendPoint[]> {
  const params = new URLSearchParams({ months: String(months) });
  if (prefectureCode) params.set("prefectureCode", prefectureCode);
  return apiFetch<PrefectureSalesTrendPoint[]>(`/sales/by-prefecture?${params.toString()}`);
}

export function fetchSalesComparison(): Promise<SalesComparisonRow[]> {
  return apiFetch<SalesComparisonRow[]>("/sales/comparison");
}
