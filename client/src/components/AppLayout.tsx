import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import GlobalNav from "./GlobalNav";
import { logout } from "../api/auth";
import { clearCurrentUser } from "../api/session";

interface AppLayoutProps {
  userName: string;
  children: ReactNode;
}

export default function AppLayout({ userName, children }: AppLayoutProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    clearCurrentUser();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <GlobalNav userName={userName} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
