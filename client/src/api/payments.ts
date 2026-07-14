import { apiFetch } from "./client";

export interface PaymentListItem {
  customerCode: number;
  customerName: string;
  dueDate: string | null;
  previousInvoice: number;
  previousPayment: number;
  outstandingAmount: number;
  isOverdue: boolean;
}

export interface PaymentDetail {
  customerCode: number;
  customerName: string;
  collectionCycle: number | null;
  collectionDay: number | null;
  currentPayment: number;
  currentSales: number;
  currentInvoice: number;
  previousPayment: number;
  previousSales: number;
  previousInvoice: number;
  twoAgoPayment: number;
  twoAgoSales: number;
  twoAgoInvoice: number;
  threeAgoPayment: number;
  threeAgoSales: number;
  threeAgoInvoice: number;
  afterInvoicePayment: number;
  previousClosingDate: string | null;
  dueDate: string | null;
  outstandingAmount: number;
  isOverdue: boolean;
}

export function fetchPayments(search: string, showAll: boolean): Promise<PaymentListItem[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (showAll) params.set("all", "true");
  const query = params.toString();
  return apiFetch<PaymentListItem[]>(`/payments${query ? `?${query}` : ""}`);
}

export function fetchPaymentDetail(customerCode: string): Promise<PaymentDetail> {
  return apiFetch<PaymentDetail>(`/payments/${customerCode}`);
}
