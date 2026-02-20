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

const ACCESS_TOKEN_KEY = "fp_access_token";

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5033";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  else window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new CustomEvent("auth-change", { detail: { token } }));
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const base = apiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return (await res.json()) as T;
}

async function getJson<T>(path: string, accessToken: string): Promise<T> {
  const base = apiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.error || `Request failed: ${res.status}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (await res.json()) as T;
}

async function postJsonAuth<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  const base = apiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.error || `Request failed: ${res.status}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (await res.json()) as T;
}

export async function signUp(email: string, password: string, displayName?: string, preferredLanguage?: string): Promise<AuthResult> {
  const result = await postJson<AuthResult>("/api/auth/signup", {
    email,
    password,
    displayName: displayName || null,
    preferredLanguage: preferredLanguage || "en",
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function patchJson<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  const base = apiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const result = await postJson<AuthResult>("/api/auth/signin", { email, password });
  setAccessToken(result.accessToken);
  return result;
}

export async function refreshAccessToken(): Promise<AuthResult> {
  const result = await postJson<AuthResult>("/api/auth/refresh", {});
  setAccessToken(result.accessToken);
  return result;
}

export async function signOut(): Promise<void> {
  await postJson("/api/auth/signout", {});
  setAccessToken(null);
}

export async function getMe(): Promise<MeResult> {
  let token = getAccessToken();

  if (!token) {
    const refreshed = await refreshAccessToken();
    token = refreshed.accessToken;
  }

  try {
    return await getJson<MeResult>("/api/account/me", token);
  } catch (err) {
    const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
    if (status !== 401) throw err;

    const refreshed = await refreshAccessToken();
    return await getJson<MeResult>("/api/account/me", refreshed.accessToken);
  }
}

export async function postAuthed<T>(path: string, body: unknown): Promise<T> {
  let token = getAccessToken();
  if (!token) {
    const refreshed = await refreshAccessToken();
    token = refreshed.accessToken;
  }

  try {
    return await postJsonAuth<T>(path, body, token);
  } catch (err) {
    const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
    if (status !== 401) throw err;

    const refreshed = await refreshAccessToken();
    return await postJsonAuth<T>(path, body, refreshed.accessToken);
  }
}
