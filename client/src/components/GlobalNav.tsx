import { useState } from "react";
import { NavLink } from "react-router-dom";
import { MENU_ITEMS } from "../config/menus";

interface GlobalNavProps {
  userName: string;
  onLogout: () => void;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {MENU_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded px-3 py-2 text-sm ${
              isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function GlobalNav({ userName, onLogout }: GlobalNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* PC: サイドメニュー */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
        <div className="mb-6 text-lg font-bold text-slate-800">EigyoCare</div>
        <NavLinks />
        <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">
          <p className="mb-2">{userName}</p>
          <button onClick={onLogout} className="text-blue-600 hover:underline">
            ログアウト
          </button>
        </div>
      </aside>

      {/* スマートフォン: ハンバーガーメニュー */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="text-lg font-bold text-slate-800">EigyoCare</div>
        <button
          aria-label="メニューを開く"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded p-2 hover:bg-slate-100"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {mobileOpen && (
        <div className="border-b border-slate-200 bg-white p-4 md:hidden">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
          <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p className="mb-2">{userName}</p>
            <button onClick={onLogout} className="text-blue-600 hover:underline">
              ログアウト
            </button>
          </div>
        </div>
      )}
    </>
  );
}
