import { createContext, useContext, useEffect, useState } from 'react';
import { clearTokenCookie, getTokenFromCookie, setTokenCookie } from '../utils/authToken';
import { apiUrl } from '../config/api';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!getTokenFromCookie());

  const fetchMe = async () => {
    const res = await apiFetch('/api/auth/me');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || 'Token invalide';
      throw new Error(msg);
    }
    return data.user;
  };

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) return;

    fetchMe()
      .then((u) => setUser(u))
      .catch(() => {
        clearTokenCookie();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Login échoué';
        throw new Error(msg);
      }

      setTokenCookie(data.token);
      const me = await fetchMe();
      setUser(me);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async ({ email, password, full_name }) => {
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Inscription échouée';
        throw new Error(msg);
      }

      // Tentative de login direct (selon config Supabase email confirmation)
      const loginRes = await login(email, password);
      if (loginRes.success) return { success: true };

      return {
        success: true,
        message: 'Inscription réussie. Si la confirmation email est activée, valide ton email puis connecte-toi.',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    clearTokenCookie();
    setUser(null);
  };

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};

