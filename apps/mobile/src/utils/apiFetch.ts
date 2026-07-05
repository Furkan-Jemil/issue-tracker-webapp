/**
 * Real HTTP client for the Issue Tracker API.
 *
 * - Uses EXPO_PUBLIC_API_URL env var (set in apps/mobile/.env)
 * - Attaches Bearer token from secure storage on every request
 * - Throws on non-2xx with the server's error message
 */
import { loadToken, deleteToken } from './secureStore';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// Navigation ref — injected by App.tsx to force logout on 401 without circular deps
type LogoutFn = () => void;
let _onUnauthorized: LogoutFn | null = null;
export function setUnauthorizedHandler(fn: LogoutFn) {
  _onUnauthorized = fn;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  if (!API_BASE) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not set. Create apps/mobile/.env with:\n' +
      'EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000',
    );
  }

  const token = await loadToken();
   const headers: Record<string, string> = {
     ...(options.headers as Record<string, string>),
     ...(token ? { Authorization: `Bearer ${token}` } : {}),
   };
  
  // Don't set Content-Type header for FormData - let the browser set it with the boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE}${path}`;
  let response: Response;

  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    throw new Error(
      `Network error — could not reach ${url}. ` +
      'Check that the server is running and your phone is on the same Wi-Fi, or use tunnel mode.',
    );
  }

  // 401 → force re-login
  if (response.status === 401) {
    await deleteToken();
    _onUnauthorized?.();
    throw new Error('Session expired — please sign in again.');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.error ?? body?.message ?? message;
    } catch { /* not JSON */ }
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) return null;

  return response.json();
}
