import { getTokenFromCookie } from './authToken';

export async function apiFetch(url, options = {}) {
  const token = getTokenFromCookie();
  const headers = new Headers(options.headers ?? {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    window.location.href = '/login';
  }

  return response;
}
