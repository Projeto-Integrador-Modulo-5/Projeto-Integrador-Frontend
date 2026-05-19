import { createContext, useContext, useEffect, useState } from 'react';
import { loginApi, registerApi, logoutApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (saved && token) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  // Escuta evento de logout disparado pelo axiosInstance ao falhar refresh
  useEffect(() => {
    const handleForceLogout = () => _clearSession();
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // ── helpers internos ──────────────────────────────────────────────────────

  const _persistSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userId', data.userId);
    const userData = {
      id:    data.userId,
      name:  data.name,
      email: data.email,
      role:  data.role,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const _clearSession = () => {
    ['token', 'refreshToken', 'userId', 'user'].forEach((k) =>
      localStorage.removeItem(k)
    );
    setUser(null);
  };

  // ── API pública do contexto ───────────────────────────────────────────────

  const login = async (email, password) => {
    const { data } = await loginApi({ email, password });
    _persistSession(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await registerApi({ name, email, password });
    _persistSession(data);
    return data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await logoutApi(refreshToken); } catch {}
    _clearSession();
  };

  const updateUserState = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserState,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
