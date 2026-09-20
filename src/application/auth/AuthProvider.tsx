import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AUTH_CHANGED_EVENT,
  getAuth,
  setAuth,
  type ApiAdminUser,
} from '../../data/api/client';
import { authApi } from '../../data/api/repositories';

interface AuthContextValue {
  user: ApiAdminUser | null;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiAdminUser | null>(() => getAuth()?.user ?? null);

  useEffect(() => {
    const sync = () => setUser(getAuth()?.user ?? null);
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  /* Revalidate the stored session against /auth/me/ on boot. */
  useEffect(() => {
    const stored = getAuth();
    if (!stored?.access) return;
    authApi
      .me()
      .then((profile) => setAuth({ ...stored, user: profile }))
      .catch(() => {
        /* token expired — the client already cleared the session */
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setAuth({ access: session.access, refresh: session.refresh, user: session.user });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setAuth(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
