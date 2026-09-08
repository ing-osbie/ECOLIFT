import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/src/lib/supabase";
import * as authService from "@/src/services/auth";
import * as profileService from "@/src/services/profile";
import { AuthContextType, Profile, UserRole } from "@/src/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const profile = await profileService.getProfile(userId);
    setUser(profile);
  }, []);

  const checkUser = useCallback(async () => {
    try {
      const session = await authService.getCurrentSession();

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Checking user error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setLoading(true);
          setTimeout(() => {
            loadProfile(session.user.id).finally(() => setLoading(false));
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    const userId = data?.session?.user?.id ?? (await authService.getCurrentSession())?.user?.id;
    if (userId) await loadProfile(userId);
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: UserRole,
  ): Promise<boolean> => {
    const data = await authService.signUp(email, password, fullName, phone, role);
    const userId = data?.session?.user?.id ?? data?.user?.id ?? (await authService.getCurrentSession())?.user?.id;
    if (userId) await loadProfile(userId);
    return Boolean(data?.session);
  };

  const signInWithGoogle = async () => {
    const completed = await authService.signInWithGoogle();
    if (completed) {
      const userId = (await authService.getCurrentSession())?.user?.id;
      if (userId) await loadProfile(userId);
    }
    return completed;
  };

  const requestPasswordReset = async (email: string) => {
    await authService.requestPasswordReset(email);
  };

  const updatePassword = async (password: string) => {
    await authService.updatePassword(password);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const refreshProfile = useCallback(async () => {
    const currentUserId = user?.id;
    if (!currentUserId) return;
    await loadProfile(currentUserId);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        requestPasswordReset,
        updatePassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
