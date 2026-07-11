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

export function fetchInvoices(customerCode: string): Promise<InvoiceListItem[]> {
  const query = customerCode ? `?customerCode=${encodeURIComponent(customerCode)}` : "";
  return apiFetch<InvoiceListItem[]>(`/invoices${query}`);
}

export function fetchInvoiceDetail(no: string): Promise<InvoiceDetail> {
  return apiFetch<InvoiceDetail>(`/invoices/${no}`);
}
