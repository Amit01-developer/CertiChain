import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { User, Organization } from '../types';

interface AuthState {
  user:         User | null;
  organization: Organization | null;
  token:        string | null;
  loading:      boolean;
}

interface AuthContextValue extends AuthState {
  login:      (email: string, password: string) => Promise<void>;
  logout:     () => void;
  setOrg:     (org: Organization) => void;
  refreshMe:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:         null,
    organization: null,
    token:        localStorage.getItem('cc_token'),
    loading:      true,
  });

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const { user, organizations } = res.data.data;
      setState(s => ({ ...s, user, organization: organizations?.[0] ?? s.organization, loading: false }));
    } catch {
      setState(s => ({ ...s, user: null, token: null, loading: false }));
      localStorage.removeItem('cc_token');
    }
  }, []);

  useEffect(() => {
    if (state.token) {
      refreshMe();
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []); // eslint-disable-line

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const { token, user, organization } = res.data.data;
    localStorage.setItem('cc_token', token);
    setState({ user, organization, token, loading: false });
  }

  function logout() {
    localStorage.removeItem('cc_token');
    setState({ user: null, organization: null, token: null, loading: false });
  }

  function setOrg(org: Organization) {
    setState(s => ({ ...s, organization: org }));
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setOrg, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
