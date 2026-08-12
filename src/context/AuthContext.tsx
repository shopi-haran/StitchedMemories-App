import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, fetchUserProfile, migrateGuestConversionJobs } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  rawUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  rawUser: null,
  isLoggedIn: false,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncUserFromSession = async (sess: Session | null) => {
    if (sess?.user) {
      setSession(sess);
      setRawUser(sess.user);

      // Migrate any guest patterns to user account
      migrateGuestConversionJobs(sess.user.id).catch((err) => {
        console.error('[AuthContext] Error migrating guest jobs:', err);
      });

      try {
        const profile = await fetchUserProfile(sess.user.id, sess.user.email);
        const displayName =
          profile?.display_name ||
          sess.user.user_metadata?.full_name ||
          sess.user.user_metadata?.display_name ||
          sess.user.email?.split('@')[0] ||
          'Crafter';
        const avatarUrl =
          profile?.avatar_url ||
          sess.user.user_metadata?.avatar_url ||
          '';

        setUser({
          id: sess.user.id,
          name: displayName,
          email: sess.user.email || '',
          avatar_url: avatarUrl,
        });
      } catch (err) {
        console.error('[AuthContext] Error fetching profile:', err);
        setUser({
          id: sess.user.id,
          name: sess.user.user_metadata?.full_name || sess.user.email?.split('@')[0] || 'Crafter',
          email: sess.user.email || '',
          avatar_url: sess.user.user_metadata?.avatar_url || '',
        });
      }
    } else {
      setSession(null);
      setRawUser(null);
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Log URL parameters and initial session
    console.log('[AuthContext Mount] window.location.href:', window.location.href);
    console.log('[AuthContext Mount] window.location.hash:', window.location.hash);
    console.log('[AuthContext Mount] window.location.search:', window.location.search);

    const initAuth = async () => {
      // Parse and handle URL tokens/code if present (e.g. OAuth redirects)
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
        try {
          console.log('[AuthContext] Access token detected in URL hash. Extracting parameters...');
          const hashClean = hash.startsWith('#') ? hash.substring(1) : hash;
          const params = new URLSearchParams(hashClean);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[AuthContext] Explicitly setting session from URL tokens...');
            const { data: setSessData, error: setSessErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            console.log('[AuthContext] setSession result:', { session: setSessData?.session, error: setSessErr });
            if (setSessData?.session && isMounted) {
              await syncUserFromSession(setSessData.session);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('[AuthContext] Error setting session from hash tokens:', e);
        }
      } else if (search && search.includes('code=')) {
        try {
          const params = new URLSearchParams(search);
          const code = params.get('code');
          if (code) {
            console.log('[AuthContext] Code detected in URL search. Exchanging code for session...');
            const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            console.log('[AuthContext] exchangeCodeForSession result:', { session: exchangeData?.session, error: exchangeErr });
            if (exchangeData?.session && isMounted) {
              await syncUserFromSession(exchangeData.session);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('[AuthContext] Error exchanging code for session:', e);
        }
      }

      // Standard initial session fetch
      try {
        const { data: { session: initSession }, error: getSessErr } = await supabase.auth.getSession();
        console.log('[AuthContext] getSession result:', { initSession, getSessErr });
        if (isMounted) {
          await syncUserFromSession(initSession);
        }
      } catch (err) {
        console.error('[AuthContext] getSession error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Auth State changes (Login, Logout, Refresh, OAuth Redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      console.log('[AuthContext] onAuthStateChange event:', _event, 'hasSession:', !!newSession, 'userId:', newSession?.user?.id);
      await syncUserFromSession(newSession);
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext] signOut error:', err);
    }
  };

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await syncUserFromSession(currentSession);
  };

  // isLoggedIn is strictly derived from active session
  const isLoggedIn = !!session;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        rawUser,
        isLoggedIn,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
