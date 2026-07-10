import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { getCurrentUser } from "./api/session";

function Home() {
  return (
    <AppLayout userName={getCurrentUser()?.userId ?? "ログインユーザー"}>
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-800">EigyoCare</h1>
        <p className="mt-2 text-slate-500">メニューから各機能を選択してください</p>
      </div>
    </AppLayout>
  );
}

export default function App() {
  return (
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
      </Routes>
    </BrowserRouter>
  );
}
