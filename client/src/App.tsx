import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";

function Home() {
  return (
    <AppLayout userName="テストユーザー">
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-800">EigyoCare</h1>
        <p className="mt-2 text-slate-500">共通コンポーネントのセットアップ完了</p>
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
      </Routes>
    </BrowserRouter>
  );
}
