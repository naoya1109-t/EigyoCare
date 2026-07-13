import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import CustomerList from "./pages/customers/CustomerList";
import CustomerDetail from "./pages/customers/CustomerDetail";
import SupplierList from "./pages/suppliers/SupplierList";
import SupplierDetail from "./pages/suppliers/SupplierDetail";
import SalesByRep from "./pages/SalesByRep";
import SalesByPrefecture from "./pages/SalesByPrefecture";
import SalesComparison from "./pages/SalesComparison";
import BudgetProgress from "./pages/BudgetProgress";
import InvoiceList from "./pages/invoices/InvoiceList";
import InvoiceDetail from "./pages/invoices/InvoiceDetail";
import Receivables from "./pages/Receivables";
import PaymentList from "./pages/payments/PaymentList";
import PaymentDetail from "./pages/payments/PaymentDetail";
import Returns from "./pages/Returns";
import Discounts from "./pages/Discounts";
import { getCurrentUser } from "./api/session";

function Home() {
  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <div className="rounded-lg bg-white p-8 shadow">
        <p className="text-slate-500">メニューから各機能を選択してください</p>
      </div>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:code" element={<CustomerDetail />} />
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/suppliers/:code" element={<SupplierDetail />} />
          <Route path="/sales/by-rep" element={<SalesByRep />} />
          <Route path="/sales/by-prefecture" element={<SalesByPrefecture />} />
          <Route path="/sales/comparison" element={<SalesComparison />} />
          <Route path="/budget-progress" element={<BudgetProgress />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/:no" element={<InvoiceDetail />} />
          <Route path="/receivables" element={<Receivables />} />
          <Route path="/payments" element={<PaymentList />} />
          <Route path="/payments/:customerCode" element={<PaymentDetail />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/discounts" element={<Discounts />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
