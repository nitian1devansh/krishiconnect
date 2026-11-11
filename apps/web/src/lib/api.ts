const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const TOKEN_STORAGE_KEY = 'krishi_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'krishi_refresh_token';
export const USER_STORAGE_KEY = 'krishi_user';

export function isValidJwtFormat(token: string | null | undefined): token is string {
  if (!token || typeof token !== 'string') return false;
  if (token.endsWith('_jwt_token')) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export class ApiClient {
  private static refreshPromise: Promise<string | null> | null = null;

  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;
    if (!isValidJwtFormat(token)) {
      this.clearStoredSession();
      return null;
    }
    return token;
  }

  static clearStoredSession() {
    if (typeof window === 'undefined') return;
    const hadAny =
      Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)) ||
      Boolean(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)) ||
      Boolean(localStorage.getItem(USER_STORAGE_KEY));
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    if (hadAny) {
      window.dispatchEvent(new Event('krishi:session-expired'));
    }
  }

  private static async tryRefreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!refreshToken || !isValidJwtFormat(refreshToken)) {
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json().catch(() => ({}));
        const newAccessToken = data?.data?.accessToken || data?.data?.token;

        if (res.ok && isValidJwtFormat(newAccessToken)) {
          localStorage.setItem(TOKEN_STORAGE_KEY, newAccessToken);
          window.dispatchEvent(
            new CustomEvent('krishi:token-refreshed', { detail: { token: newAccessToken } })
          );
          return newAccessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    allowRefresh = true
  ): Promise<T> {
    const token = this.getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers,
      });
    } catch {
      const netErr = new Error('Unable to connect to the KrishiConnect server. Please try again.') as any;
      netErr.status = 0;
      throw netErr;
    }

    // Automatically refresh expired JWT once and retry seamlessly
    const isAuthMutation =
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/refresh-token');

    if (res.status === 401 && allowRefresh && !isAuthMutation && typeof window !== 'undefined') {
      const refreshedToken = await this.tryRefreshAccessToken();
      if (refreshedToken) {
        return this.request<T>(endpoint, options, false);
      }

      if (token || localStorage.getItem(USER_STORAGE_KEY)) {
        this.clearStoredSession();
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        res.status === 401
          ? 'Your session has expired. Please sign in again.'
          : data.message || `API Error: ${res.status} ${res.statusText}`;
      const error = new Error(message) as any;
      error.status = res.status;
      error.errors = data.errors;
      error.sessionExpired = res.status === 401;
      throw error;
    }

    return data;
  }

  static get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static patch<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static put<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
