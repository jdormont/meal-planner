import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';
import { useAnalytics } from '../hooks/useAnalytics';

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { identify } = useAnalytics();

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user profile:', error);
    }

    setUserProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        identify(session.user.id, { email: session.user.email });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserProfile(session.user.id);
          identify(session.user.id, { email: session.user.email });
        } else {
          setUserProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // We already identified in the session check, but we could update traits here if profile changes
    // avoiding redundant calls for now unless profile has distinct traits we want in PostHog people profiles

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setUserProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      // Force local cleanup if server request fails
      // Supabase default key format: sb-<project_id>-auth-token
      try {
        const url = new URL(import.meta.env.VITE_SUPABASE_URL);
        const projectId = url.hostname.split('.')[0];
        localStorage.removeItem(`sb-${projectId}-auth-token`);
      } catch (e) {
        console.warn('Could not determine Supabase project ID for cleanup', e);
      }
      
      setUser(null);
      setUserProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
