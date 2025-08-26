// Central configuration for API base URLs
// Derives from NEXT_PUBLIC_API_URL (e.g., http://localhost:8001/api)
// and appends version segment.

const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api').replace(/\/$/, '');
export const API_VERSION = 'v1';
export const API_BASE = `${RAW_API_URL}/${API_VERSION}`; // e.g. http://localhost:8001/api/v1

// Helper to build endpoint paths consistently
export function apiEndpoint(path: string) {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}

// Specific bases for grouped resources (optional convenience)
export const CHECKLIST_BASE = apiEndpoint('/checklist');

// Generic authenticated fetch wrapper (optional)
export async function authJsonFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(apiEndpoint(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}