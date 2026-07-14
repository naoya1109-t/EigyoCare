import { apiFetch } from "./client";

export interface PaymentListItem {
  customerCode: number;
  customerName: string;
  repName: string | null;
  dueDate: string | null;
  previousInvoice: number;
  afterInvoicePayment: number;
  outstandingAmount: number;
  isOverdue: boolean;
}

export interface PaymentDetail {
  customerCode: number;
  customerName: string;
  repName: string | null;
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

export interface PaymentFilters {
  search: string;
  showAll: boolean;
  repCode: string;
}

export function fetchPayments(filters: PaymentFilters): Promise<PaymentListItem[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.showAll) params.set("all", "true");
  if (filters.repCode) params.set("repCode", filters.repCode);
  const query = params.toString();
  return apiFetch<PaymentListItem[]>(`/payments${query ? `?${query}` : ""}`);
}

export function fetchPaymentDetail(customerCode: string): Promise<PaymentDetail> {
  return apiFetch<PaymentDetail>(`/payments/${customerCode}`);
}
