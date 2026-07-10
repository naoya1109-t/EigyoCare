import { apiFetch } from "./client";

export interface LoginResponse {
  userId: string;
  repCode: string;
}

export function login(userId: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ userId, password }),
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/logout", { method: "POST" });
}
