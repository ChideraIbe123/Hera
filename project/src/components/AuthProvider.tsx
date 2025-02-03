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
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] =
    useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || loading) {
        setCheckingPreferences(false);
        return;
      }

      // Don't check preferences if we're already on the onboarding page
      if (location.pathname === "/onboarding") {
        console.log("On onboarding page, skipping preferences check");
        setCheckingPreferences(false);
        return;
      }

      try {
        console.log("Checking user preferences...");
        const { data: preferences, error } = await supabase
          .from("user_preferences")
          .select("onboarded")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking onboarding status:", error);
        }

        console.log("Preferences data:", preferences);

        // Only redirect to onboarding if we're not already there and preferences indicate we should
        if (!preferences?.onboarded && location.pathname !== "/onboarding") {
          console.log("Setting redirect to onboarding");
          setShouldRedirectToOnboarding(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
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

  if (shouldRedirectToOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
