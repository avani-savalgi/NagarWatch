import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('nagarwatch_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (kgid, password) => {
    const { token, user: loggedInUser } = await api.login(kgid, password);
    localStorage.setItem('nagarwatch_token', token);
    localStorage.setItem('nagarwatch_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nagarwatch_token');
    localStorage.removeItem('nagarwatch_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
