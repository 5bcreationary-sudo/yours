import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/database";
import { supabase } from "@/lib/supabase";

// Real Supabase-backed auth. Consumers should use `useAuth()` to read the
// context provided at the app root. The root calls `useAuthState()` exactly
// once (wiring subscriptions). Route guards read the same state via context.

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
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

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

async function loadProfile(userId: string, accessToken?: string): Promise<UserProfile | null> {
  // Use raw fetch instead of supabase.from(...) — the supabase client's query
  // pipeline awaits getSession() internally, which can hang on page reload,
  // making this never resolve. Raw fetch with the JWT is robust.
  const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
  const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const url = `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=*`;
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Accept: "application/vnd.pgrst.object+json",
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (res.status === 406) return null; // no rows (PostgREST single-object request)
    if (!res.ok) {
      console.warn("[yours] loadProfile non-OK", res.status);
      return null;
    }
    const json = await res.json();
    return (json as UserProfile) ?? null;
  } catch (err) {
    console.warn("[yours] loadProfile failed/timeout", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Google doesn't surface provider_refresh_token in the session after a
// Supabase-managed exchange. We capture it from the redirect URL fragment
// (Supabase forwards it when access_type=offline) and POST to the edge
// function, which encrypts + stores it in user_sources.
async function captureGoogleRefreshToken(session: Session) {
  const anySession = session as unknown as {
    provider_refresh_token?: string;
    provider_token?: string;
    expires_in?: number;
    user?: { app_metadata?: { provider?: string } };
  };
  const refresh = anySession.provider_refresh_token;
  if (!refresh) return;
  if (anySession.user?.app_metadata?.provider !== "google") return;

  try {
    const base = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
    await fetch(`${base}/functions/v1/google-oauth-callback`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        provider_refresh_token: refresh,
        provider_token: anySession.provider_token,
        expires_in: anySession.expires_in,
        scopes: GOOGLE_SCOPES,
      }),
    });
  } catch (err) {
    console.warn("[yours] google-oauth-callback failed", err);
  }
}

export function useAuthState(): AuthState {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    let mounted = true;

    // Hard ceiling so the app NEVER stays stuck on the "Loading..." screen.
    // If getSession or loadProfile somehow hangs, the spinner clears after 10s
    // and the app falls back to its unauthed state (route guards redirect).
    const failsafe = setTimeout(() => {
      if (mounted) {
        console.warn("[yours] auth bootstrap timeout — forcing loading=false");
        setLoading(false);
      }
    }, 10000);

    // Bootstrap: read session synchronously from localStorage and use raw
    // fetch for the profile query. supabase.auth.getSession() and the .from()
    // pipeline can hang indefinitely on page reload (cross-tab Web Lock
    // contention in supabase-js v2), which manifested as "loads forever" for
    // signed-in users. Reading the persisted session directly bypasses the lock.
    const bootstrap = async () => {
      let storedSession: { access_token: string; refresh_token: string; expires_at: number; user: { id: string } } | null = null;
      try {
        const raw = localStorage.getItem("yours-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          const candidate = parsed?.access_token ? parsed : parsed?.currentSession;
          if (candidate?.access_token && candidate?.expires_at && candidate.expires_at * 1000 > Date.now()) {
            storedSession = candidate;
          }
        }
      } catch {
        // ignore parse errors — proceed unauthed
      }

      if (storedSession?.user?.id) {
        const profile = await loadProfile(storedSession.user.id, storedSession.access_token);
        if (mounted) setUser(profile);
      }
      if (mounted) {
        setLoading(false);
        clearTimeout(failsafe);
      }
    };
    bootstrap().catch((err) => {
      console.warn("[yours] auth bootstrap error", err);
      if (mounted) {
        setLoading(false);
        clearTimeout(failsafe);
      }
    });

    // Subscribe
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        // Pass the fresh access_token so loadProfile's raw-fetch path can
        // satisfy the public.users RLS policy (auth.uid() = id) — without it
        // the unauthenticated request returns 0 rows and user stays null.
        // Wait briefly for the public.users row created by the auth trigger.
        let profile = await loadProfile(session.user.id, session.access_token);
        if (!profile) {
          await new Promise((r) => setTimeout(r, 250));
          profile = await loadProfile(session.user.id, session.access_token);
        }
        if (mounted) setUser(profile);

        // Capture Google refresh token on first sign-in after consent.
        if (event === "SIGNED_IN") {
          void captureGoogleRefreshToken(session);
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
        scopes: GOOGLE_SCOPES,
        // access_type=offline + prompt=consent are required so Google issues
        // a refresh_token that Supabase surfaces on the session.
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) throw error;
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      },
    });
    if (error) throw error;
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      },
    });
    if (error) throw error;
    // If email confirmation is disabled, the user is signed in immediately.
    // If enabled, identities will be empty for duplicate emails (Supabase
    // doesn't reveal whether the email exists). Surface a helpful message.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error("An account with this email may already exist. Try signing in instead.");
    }
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error("Profile not loaded yet — please wait a moment and try again.");
      // RLS allows UPDATE-self but blocks INSERT (see users_no_direct_insert).
      // The auth trigger creates the row on signup, so the row should always exist.
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (data) setUser(data as UserProfile);
    },
    [user],
  );

  return { user, loading, signInWithGoogle, signInWithMagicLink, signUpWithPassword, signInWithPassword, signOut, updateProfile };
}
