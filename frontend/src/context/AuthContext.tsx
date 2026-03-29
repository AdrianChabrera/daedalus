import { createContext, useContext, useState, type ReactNode } from 'react';
import { API_ROUTES } from '../config/api';

interface AuthResult {
  accessToken: string;
  userId: number;
  username: string;
}

interface AuthContextType {
  user: AuthResult | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<AuthResult | null>(() => {
    const stored = localStorage.getItem('daedalus_auth');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('daedalus_auth');
      return null;
    }
  });

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_ROUTES.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Credenciales incorrectas');
    }

    const data: AuthResult = await res.json();
    setUser(data);
    localStorage.setItem('daedalus_auth', JSON.stringify(data));
  };

  const register = async (username: string, password: string) => {
    const res = await fetch(`${API_ROUTES.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al registrar el usuario');
    }

    const data: AuthResult = await res.json();
    setUser(data);
    localStorage.setItem('daedalus_auth', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('daedalus_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}