import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from '../api/client';
import type { AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../api/types';

/**
 * The JWT goes to Keychain (iOS) / Keystore (Android) via expo-secure-store, not
 * AsyncStorage — AsyncStorage is unencrypted and readable on a rooted device.
 * The token is well under SecureStore's ~2KB practical limit.
 */
const TOKEN_KEY = 'eldercare.token';
const SESSION_KEY = 'eldercare.session';

export interface Session {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  session: Session | null;
  /** True until the stored token has been read back at launch. */
  loading: boolean;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signUp: (details: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setSession(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(SESSION_KEY),
    ]);
  }, []);

  const persist = useCallback(async (auth: AuthResponse) => {
    const next: Session = {
      userId: auth.userId,
      name: auth.name,
      email: auth.email,
      role: auth.role,
    };
    setAuthToken(auth.token);
    setSession(next);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, auth.token),
      SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next)),
    ]);
  }, []);

  // Restore a previous sign-in. Tokens last 24h server-side and there are no
  // refresh tokens yet, so an expired one simply fails the next call with 401
  // and the handler below signs the user out.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [token, stored] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(SESSION_KEY),
        ]);
        if (cancelled) return;
        if (token && stored) {
          setAuthToken(token);
          setSession(JSON.parse(stored) as Session);
        }
      } catch {
        // A corrupt or unreadable keystore entry should not brick the app;
        // treat it as signed out.
        if (!cancelled) await clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      signIn: async (credentials) => persist(await api.login(credentials)),
      signUp: async (details) => persist(await api.register(details)),
      signOut: clearSession,
    }),
    [session, loading, persist, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
