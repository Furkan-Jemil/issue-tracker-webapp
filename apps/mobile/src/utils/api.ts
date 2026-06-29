import { mockApiFetch } from './mockData';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function safeFetch(url: string, options: RequestInit = {}): Promise<any> {
  try {
    return await mockApiFetch(url, options);
  } catch {
    // fall through to real API
  }
  const res = await fetch(apiUrl(url), { ...options });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}
