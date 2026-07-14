import { apiFetch } from "./client";

export interface InvoiceListItem {
  invoiceNo: number;
  invoiceDate: string;
  customerCode: number;
  customerName: string;
  salesAmount: number;
  taxAmount: number;
  paymentAmount: number;
  balance: number;
}

export interface InvoiceLine {
  lineNumber: number;
  saleDate: string;
  item: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  remarks: string | null;
}

export interface InvoiceDetail {
  invoiceNo: number;
  invoiceDate: string;
  dueDate: string;
  customerCode: number;
  customerName: string;
  previousBalance: number;
  salesAmount: number;
  taxAmount: number;
  paymentAmount: number;
  balance: number;
  lines: InvoiceLine[];
}

export interface InvoiceFilters {
  customerCode: string;
  customerName: string;
}

export function fetchInvoices(filters: InvoiceFilters): Promise<InvoiceListItem[]> {
  const params = new URLSearchParams();
  if (filters.customerCode) params.set("customerCode", filters.customerCode);
  if (filters.customerName) params.set("customerName", filters.customerName);
  const query = params.toString();
  return apiFetch<InvoiceListItem[]>(`/invoices${query ? `?${query}` : ""}`);
}

export function fetchInvoiceDetail(no: string): Promise<InvoiceDetail> {
  return apiFetch<InvoiceDetail>(`/invoices/${no}`);
}
