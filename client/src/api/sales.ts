import { apiFetch } from "./client";

export interface RepSalesRow {
  repCode: number;
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

export function fetchRepMonths(): Promise<string[]> {
  return apiFetch<string[]>("/sales/rep-months");
}

export function fetchSalesByRep(month: string): Promise<RepSalesRow[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiFetch<RepSalesRow[]>(`/sales/by-rep${query}`);
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
