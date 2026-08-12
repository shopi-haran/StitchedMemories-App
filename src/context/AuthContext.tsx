import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, fetchUserProfile } from '../lib/supabase';

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
    setSession(sess);
    setRawUser(sess?.user || null);

    if (sess?.user) {
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
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session directly from Supabase SDK
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (!isMounted) return;
      syncUserFromSession(initSession).finally(() => {
        if (isMounted) setIsLoading(false);
      });
    }).catch(err => {
      console.error('[AuthContext] getSession error:', err);
      if (isMounted) setIsLoading(false);
    });

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

  // Crucial: isLoggedIn is strictly boolean !!session derived directly from real session
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
