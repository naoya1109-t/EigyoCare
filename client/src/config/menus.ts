export interface MenuItem {
  label: string;
  path: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { label: "担当者別売上推移", path: "/sales/by-rep" },
  { label: "県別売上推移", path: "/sales/by-prefecture" },
  { label: "顧客情報", path: "/customers" },
  { label: "仕入先情報", path: "/suppliers" },
  { label: "請求情報", path: "/invoices" },
  { label: "売掛金一覧", path: "/receivables" },
  { label: "入金確認", path: "/payments" },
  { label: "担当者別売上対比", path: "/sales/comparison" },
  { label: "担当者別予算進捗", path: "/budget-progress" },
  { label: "返品", path: "/returns" },
  { label: "値引", path: "/discounts" },
];
