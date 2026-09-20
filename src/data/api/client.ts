/**
 * Tiny fetch client for the Nyanopan backend with JWT handling:
 * attaches the access token, transparently refreshes once on 401,
 * and broadcasts a logout event when the session cannot be restored.
 */

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'https://nyanopan.onrender.com';

export interface ApiAdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface StoredAuth {
  access: string;
  refresh: string;
  user: ApiAdminUser | null;
}

const AUTH_KEY = 'nyanopan.auth';
export const AUTH_CHANGED_EVENT = 'nyanopan:auth-changed';

export function getAuth(): StoredAuth | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function setAuth(auth: StoredAuth | null): void {
  try {
    if (auth) window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    else window.localStorage.removeItem(AUTH_KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface Envelope<T> {
  success?: boolean;
  message?: string;
  detail?: string;
  data?: T;
}

/** Recursively flattens DRF error structures (nested serializers and
 *  per-item list errors) into readable "path: message" strings. */
function flattenErrors(value: unknown, prefix = '', out: string[] = []): string[] {
  if (Array.isArray(value)) {
    const texts = value.filter((v): v is string => typeof v === 'string');
    if (texts.length > 0) out.push(prefix ? `${prefix}: ${texts.join(' ')}` : texts.join(' '));
    value.forEach((item, i) => {
      if (item && typeof item === 'object') {
        flattenErrors(item, prefix ? `${prefix}[${i}]` : `[${i}]`, out);
      }
    });
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      const path = key === 'non_field_errors' || key === 'detail' ? prefix : prefix ? `${prefix}.${key}` : key;
      flattenErrors(v, path, out);
    }
  } else if (value != null) {
    out.push(prefix ? `${prefix}: ${String(value)}` : String(value));
  }
  return out;
}

/**
 * Prefer the backend's own message; when the envelope carries a field-level
 * `errors` object, surface the first few entries so toasts stay actionable.
 */
function extractMessage(rawPayload: unknown, status: number): string {
  const payload = (rawPayload ?? {}) as Record<string, unknown>;
  const base =
    (typeof payload.message === 'string' ? payload.message : null) ??
    (typeof payload.detail === 'string' ? payload.detail : null) ??
    (typeof payload.data === 'string' ? payload.data : null) ??
    `Request failed (${status})`;

  const envelopeKeys = new Set(['success', 'status', 'data', 'message', 'detail', 'statusCode']);
  let errors: unknown = payload.errors;
  if (!errors || typeof errors !== 'object') {
    // DRF may also return field errors at the top level of the payload.
    const extra = Object.entries(payload).filter(([key]) => !envelopeKeys.has(key));
    errors = extra.length > 0 ? Object.fromEntries(extra) : null;
  }
  if (errors && typeof errors === 'object') {
    const parts = flattenErrors(errors).filter(Boolean);
    if (parts.length > 0) return parts.slice(0, 3).join(' · ');
  }
  return base;
}

async function refreshAccess(): Promise<string | null> {
  const auth = getAuth();
  if (!auth?.refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: auth.refresh }),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as Envelope<{ access: string }> & { access?: string };
    const access = payload?.data?.access ?? payload?.access;
    if (!access) return null;
    setAuth({ ...auth, access });
    return access;
  } catch {
    return null;
  }
}

export interface ApiOptions {
  method?: string;
  /** JSON body (Content-Type: application/json). */
  json?: unknown;
  /** Raw body, e.g. FormData for multipart writes. */
  body?: BodyInit;
  /** Set false for unauthenticated calls (login). */
  auth?: boolean;
}

export async function apiRequest<T>(pathOrUrl: string, opts: ApiOptions = {}): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const wantsAuth = opts.auth !== false;

  const buildHeaders = () => {
    const headers: Record<string, string> = {};
    if (opts.json !== undefined) headers['Content-Type'] = 'application/json';
    const token = getAuth()?.access;
    if (wantsAuth && token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const buildBody = () =>
    opts.json !== undefined ? JSON.stringify(opts.json) : opts.body;

  let res = await fetch(url, { method: opts.method ?? 'GET', headers: buildHeaders(), body: buildBody() });

  if (res.status === 401 && wantsAuth && getAuth()?.refresh) {
    const access = await refreshAccess();
    if (access) {
      res = await fetch(url, { method: opts.method ?? 'GET', headers: buildHeaders(), body: buildBody() });
    }
  }

  let payload: (Envelope<T> & T) | null = null;
  const text = await res.text();
  try {
    payload = text ? (JSON.parse(text) as Envelope<T> & T) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    if (res.status === 401 && wantsAuth) setAuth(null);
    throw new ApiError(extractMessage(payload, res.status), res.status);
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}
