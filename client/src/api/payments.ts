import { apiFetch } from "./client";

export interface PaymentListItem {
  customerCode: number;
  customerName: string;
  currentPayment: number;
  currentSales: number;
  currentInvoice: number;
  previousPayment: number;
  previousSales: number;
  previousInvoice: number;
}

export interface PaymentDetail extends PaymentListItem {
  twoAgoPayment: number;
  twoAgoSales: number;
  twoAgoInvoice: number;
  threeAgoPayment: number;
  threeAgoSales: number;
  threeAgoInvoice: number;
  afterInvoicePayment: number;
  previousClosingDate: string | null;
}

export function fetchPayments(search: string): Promise<PaymentListItem[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<PaymentListItem[]>(`/payments${query}`);
}

export function fetchPaymentDetail(customerCode: string): Promise<PaymentDetail> {
  return apiFetch<PaymentDetail>(`/payments/${customerCode}`);
}
