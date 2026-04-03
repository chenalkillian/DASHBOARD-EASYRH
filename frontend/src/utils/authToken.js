export const getTokenFromCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const setTokenCookie = (token) => {
  if (typeof document === 'undefined') return;
  document.cookie = `token=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
};

export const clearTokenCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'token=; Max-Age=0; Path=/';
};

