import { Me } from "./types";
import { API_BASE_URL } from "./config";

async function ensureCsrf() {
  const res = await fetch(`${API_BASE_URL}/csrf`, { credentials: "include" });
  return res.json() as Promise<{ headerName: string; token: string }>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parse(res: Response) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = await ensureCsrf();
    if (token?.token) {
      headers.set(token.headerName || "X-XSRF-TOKEN", token.token);
    }
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const data = await parse(res);
  if (!res.ok) {
    throw new ApiError(res.status, data?.code || "ERROR", data?.message || "Request failed");
  }
  return data as T;
}

export function getMe() {
  return api<Me>("/auth/me");
}

export function sendOtp(email: string) {
  return api<void>("/auth/send-otp", { method: "POST", body: JSON.stringify({ email }) });
}

export function verifyOtp(email: string, code: string) {
  return api<Me>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, code }) });
}

export function logout() {
  return api<void>("/auth/logout", { method: "POST" });
}

export function onboard(name?: string) {
  return api<Me>("/auth/onboarding", { method: "POST", body: JSON.stringify({ name }) });
}

export function refreshSession() {
  return api<Me>("/auth/refresh", { method: "POST" });
}
