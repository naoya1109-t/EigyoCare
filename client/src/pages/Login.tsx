import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { setCurrentUser } from "../api/session";
import { ApiError } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(userId, password);
      setCurrentUser(user);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow"
      >
        <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="shrink-0 text-blue-600"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {/* eslint-disable-next-line no-irregular-whitespace */}
          介援隊 営業支援　ログイン
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-600">ユーザーID</span>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoComplete="username"
            required
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-slate-600">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
