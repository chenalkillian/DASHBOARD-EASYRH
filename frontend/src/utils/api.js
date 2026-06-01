import { apiUrl } from '../config/api';
import { clearTokenCookie, getTokenFromCookie } from './authToken';

const isPublicAuthRequest = (url) =>
  /\/api\/auth\/(login|register)$/.test(url);

export async function apiFetch(url, options = {}) {
  const token = getTokenFromCookie();
  const headers = new Headers(options.headers ?? {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resolvedUrl = url.startsWith('http') ? url : apiUrl(url);
  const response = await fetch(resolvedUrl, { ...options, headers });

  if (response.status === 401 && !isPublicAuthRequest(resolvedUrl)) {
    clearTokenCookie();
    window.location.href = '/login';
  }

  return response;
}
