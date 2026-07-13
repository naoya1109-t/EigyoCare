import { apiFetch } from "./client";

export interface CustomerListItem {
  customerCode: number;
  customerName: string;
  customerNameKana: string | null;
  prefecture: string | null;
  tel: string | null;
  repName: string | null;
}

export interface CustomerDetail {
  customerCode: number;
  customerName: string;
  customerNameKana: string | null;
  zipCode: string | null;
  prefecture: string | null;
  address1: string | null;
  address2: string | null;
  tel: string | null;
  fax: string | null;
  email: string | null;
  contactDept: string | null;
  contactTitle: string | null;
  contactName: string | null;
  repName: string | null;
  closingDay: number | null;
  lastPurchaseDate: string | null;
  lastPaymentDate: string | null;
}

export interface CustomerFilters {
  search: string;
  prefectureCode: string;
  repCode: string;
}

export function fetchCustomers(filters: CustomerFilters): Promise<CustomerListItem[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.prefectureCode) params.set("prefectureCode", filters.prefectureCode);
  if (filters.repCode) params.set("repCode", filters.repCode);
  const query = params.toString();
  return apiFetch<CustomerListItem[]>(`/customers${query ? `?${query}` : ""}`);
}

export function fetchCustomerDetail(code: string): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/customers/${code}`);
}

export interface CustomerReceivableRow {
  yearMonth: string;
  salesAmount: number;
  paymentAmount: number;
}

export function fetchCustomerReceivables(code: string): Promise<CustomerReceivableRow[]> {
  return apiFetch<CustomerReceivableRow[]>(`/customers/${code}/receivables`);
}
