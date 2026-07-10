import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-800">EigyoCare</h1>
        <p className="mt-2 text-slate-500">プロジェクト雛形セットアップ完了</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
