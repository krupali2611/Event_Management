import { createContext, useEffect, useState, type PropsWithChildren } from 'react';
import { authService, type LoginPayload, type RegisterPayload } from '@/services/auth.service';
import type { AuthUser } from '@/types/api';
import { AUTH_TOKEN_KEY } from '@/utils/authStorage';

export interface AuthContextValue {
  currentUser: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = (nextToken: string, user: AuthUser): void => {
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    setToken(nextToken);
    setCurrentUser(user);
  };

  const clearSession = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    const hydrateAuth = async (): Promise<void> => {
      const storedToken = readStoredToken();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.me();
        setToken(storedToken);
        setCurrentUser(response.data ?? null);
      } catch (_error) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    void hydrateAuth();
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthUser> => {
    const response = await authService.login(payload);

    if (!response.data) {
      throw new Error('Login failed');
    }

    persistSession(response.data.token, response.data.user);
    return response.data.user;
  };

  const register = async (payload: RegisterPayload): Promise<AuthUser> => {
    const response = await authService.register(payload);

    if (!response.data) {
      throw new Error('Registration failed');
    }

    persistSession(response.data.token, response.data.user);
    return response.data.user;
  };

  const logout = (): void => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: Boolean(token && currentUser),
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
