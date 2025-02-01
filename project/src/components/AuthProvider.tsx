import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingPreferences, setCheckingPreferences] = useState(true);
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || loading) {
        setCheckingPreferences(false);
        return;
      }

      if (location.pathname === '/onboarding') {
        setCheckingPreferences(false);
        return;
      }

      try {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('onboarded')
          .eq('user_id', user.id)
          .maybeSingle();

        setShouldRedirectToOnboarding(!preferences?.onboarded);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setCheckingPreferences(false);
      }
    };

    checkOnboarding();
  }, [user, loading, location.pathname]);

  if (loading || checkingPreferences) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (shouldRedirectToOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}