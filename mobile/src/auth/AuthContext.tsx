import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { api, markSessionRestored, setAuthToken, setUnauthorizedHandler } from '../api/client';
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest, UserRole } from '../api/types';
import { deleteItem, getItem, setItem } from './storage';

/**
 * On device the JWT goes to Keychain (iOS) / Keystore (Android) rather than
 * AsyncStorage, which is unencrypted and readable on a rooted device. See
 * ./storage for the web preview's weaker fallback.
 */
const TOKEN_KEY = 'eldercare.token';
const SESSION_KEY = 'eldercare.session';

export interface Session {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

interface AuthState {
  session: Session | null;
  /** True until the stored token has been read back at launch. */
  loading: boolean;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signUp: (details: RegisterRequest) => Promise<void>;
  /** Signs in with a response the server already issued, e.g. after a password reset. */
  acceptSignIn: (auth: AuthResponse) => Promise<void>;
  /** Replaces the stored profile, e.g. once the email is confirmed. */
  updateProfile: (me: MeResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setSession(null);
    await Promise.all([deleteItem(TOKEN_KEY), deleteItem(SESSION_KEY)]);
  }, []);

  const persist = useCallback(async (auth: AuthResponse) => {
    const next: Session = {
      userId: auth.userId,
      name: auth.name,
      email: auth.email,
      role: auth.role,
      emailVerified: auth.emailVerified,
    };
    setAuthToken(auth.token);
    setSession(next);
    await Promise.all([
      setItem(TOKEN_KEY, auth.token),
      setItem(SESSION_KEY, JSON.stringify(next)),
    ]);
  }, []);

  const updateProfile = useCallback(async (me: MeResponse) => {
    const next: Session = {
      userId: me.userId,
      name: me.name,
      email: me.email,
      role: me.role,
      emailVerified: me.emailVerified,
    };
    setSession(next);
    await setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  // Restore a previous sign-in. Tokens last 24h server-side and there are no
  // refresh tokens yet, so an expired one simply fails the next call with 401
  // and the handler below signs the user out.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [token, stored] = await Promise.all([
          getItem(TOKEN_KEY),
          getItem(SESSION_KEY),
        ]);
        if (cancelled) return;
        if (token && stored) {
          setAuthToken(token);
          setSession(JSON.parse(stored) as Session);
          // The stored copy may be stale, e.g. the email was confirmed on another
          // device, or it predates a field. Refresh it in the background.
          api.me().then(
            (me) => {
              if (!cancelled) void updateProfile(me);
            },
            () => {},
          );
        }
      } catch {
        // A corrupt or unreadable keystore entry should not brick the app;
        // treat it as signed out.
        if (!cancelled) await clearSession();
      } finally {
        // Unblocks API calls queued while the token was being read.
        markSessionRestored();
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession, updateProfile]);

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
      acceptSignIn: persist,
      updateProfile,
      signOut: clearSession,
    }),
    [session, loading, persist, updateProfile, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
