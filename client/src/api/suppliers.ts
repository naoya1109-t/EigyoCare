import { apiFetch } from "./client";

export interface SupplierListItem {
  supplierCode: number;
  supplierName: string;
  supplierNameKana: string | null;
  prefecture: string | null;
  tel: string | null;
}

export interface SupplierDetail {
  supplierCode: number;
  supplierName: string;
  supplierNameKana: string | null;
  zipCode: string | null;
  prefecture: string | null;
  address1: string | null;
  address2: string | null;
  tel: string | null;
  fax: string | null;
  homepage: string | null;
  representativeName: string | null;
  contactDept: string | null;
  contactTitle: string | null;
  contactName: string | null;
  contactTel: string | null;
  email: string | null;
  remarks: string | null;
}

export function fetchSuppliers(search: string): Promise<SupplierListItem[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<SupplierListItem[]>(`/suppliers${query}`);
}

export function fetchSupplierDetail(code: string): Promise<SupplierDetail> {
  return apiFetch<SupplierDetail>(`/suppliers/${code}`);
}

export interface SupplierPayableRow {
  yearMonth: string;
  purchaseAmount: number;
  discountAmount: number;
}

export function fetchSupplierPayables(code: string): Promise<SupplierPayableRow[]> {
  return apiFetch<SupplierPayableRow[]>(`/suppliers/${code}/payables`);
}
