import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { UserProfile } from "@/types/database";

// Mock auth context — will be replaced with real Supabase auth
interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AuthContext };

export function useAuthState(): AuthState {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for mock session
    const stored = localStorage.getItem("yours-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // TODO: Codex — replace with supabase.auth.signInWithOAuth({ provider: "google" })
    const mockProfile: UserProfile = {
      id: crypto.randomUUID(),
      email: "user@gmail.com",
      full_name: "Demo User",
      avatar_url: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      delivery_time: "07:00",
      preferred_length_minutes: 8,
      tone: "upbeat",
      briefing_mode: "morning",
      onboarding_complete: false,
      evening_preference: false,
      home_address: null,
      work_address: null,
      created_at: new Date().toISOString(),
    };
    setUser(mockProfile);
    localStorage.setItem("yours-user", JSON.stringify(mockProfile));
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    // TODO: Codex — replace with supabase.auth.signInWithOtp({ email })
    const mockProfile: UserProfile = {
      id: crypto.randomUUID(),
      email,
      full_name: null,
      avatar_url: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      delivery_time: "07:00",
      preferred_length_minutes: 8,
      tone: "upbeat",
      briefing_mode: "morning",
      onboarding_complete: false,
      evening_preference: false,
      home_address: null,
      work_address: null,
      created_at: new Date().toISOString(),
    };
    setUser(mockProfile);
    localStorage.setItem("yours-user", JSON.stringify(mockProfile));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("yours-user");
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("yours-user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { user, loading, signInWithGoogle, signInWithMagicLink, signOut, updateProfile };
}
