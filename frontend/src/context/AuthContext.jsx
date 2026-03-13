import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { assertSupabaseConfigured } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription;

    const setupAuth = async () => {
      try {
        const supabase = assertSupabaseConfigured();
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setLoading(false);
        });

        subscription = authSubscription;
      } catch (_error) {
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setupAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const supabase = assertSupabaseConfigured();
    const response = await supabase.auth.signInWithPassword({ email, password });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  };

  const register = async (email, password) => {
    const supabase = assertSupabaseConfigured();
    const response = await supabase.auth.signUp({ email, password });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  };

  const logout = async () => {
    const supabase = assertSupabaseConfigured();
    const response = await supabase.auth.signOut();

    if (response.error) {
      throw response.error;
    }
  };

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      login,
      register,
      logout,
    }),
    [session, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
