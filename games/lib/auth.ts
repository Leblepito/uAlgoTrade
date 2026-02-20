export type AuthResult = {
  accessToken: string;
  accessTokenExpiresAt: number;
  userId: string;
  email: string;
  displayName: string | null;
  roles: string[];
};

export type MeResult = {
  userId: string;
  email: string | null;
  displayName: string | null;
  roles: string[];
  planCode: string;
  maxIndicators: number;
  maxBacktestsPerDay: number;
};

const TOKEN_KEY = "ukeytr_games_access_token";

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5033";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function getJson<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const result = await postJson<AuthResult>("/api/auth/signin", { email, password });
  setAccessToken(result.accessToken);
  return result;
}

export async function signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
  const result = await postJson<AuthResult>("/api/auth/signup", {
    email,
    password,
    displayName: displayName || null,
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function getMe(): Promise<MeResult> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated.");
  return await getJson<MeResult>("/api/account/me", token);
}

export async function signOut(): Promise<void> {
  try {
    await postJson("/api/auth/signout", {});
  } finally {
    setAccessToken(null);
  }
}
