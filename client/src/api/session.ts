export interface CurrentUser {
  userId: string;
  repCode: string;
}

const STORAGE_KEY = "eigyocare.currentUser";

export function setCurrentUser(user: CurrentUser): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getCurrentUser(): CurrentUser | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as CurrentUser) : null;
}

export function clearCurrentUser(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
