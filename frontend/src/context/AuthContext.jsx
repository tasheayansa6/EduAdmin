import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
    });

    if (!getToken()) {
      setReady(true);
      return undefined;
    }

    let active = true;
    api('/api/v1/auth/me')
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    async login(email, password) {
      const data = await api('/api/v1/auth/login', { method: 'POST', body: { email, password } });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    async register(body) {
      const data = await api('/api/v1/auth/register', { method: 'POST', body });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    async logout() {
      try {
        await api('/api/v1/auth/logout', { method: 'POST' });
      } catch {
        // The local session is cleared either way.
      }
      clearToken();
      setUser(null);
    },
    updateUser(next) {
      setUser(next);
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
