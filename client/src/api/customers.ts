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

export function fetchCustomers(search: string): Promise<CustomerListItem[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<CustomerListItem[]>(`/customers${query}`);
}

export function fetchCustomerDetail(code: string): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/customers/${code}`);
}
