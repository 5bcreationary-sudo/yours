import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Headphones, ListMusic, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getBriefingForPlayer } from "@/lib/supabase";
import { YoursLogo } from "@/components/YoursLogo";
import { toast } from "sonner";

/**
 * Sign-up gate for a shared briefing. The visitor lands here from a share
 * link (/listen/:id?t=<jwt>). They see a teaser of the briefing (sections,
 * length) but cannot play until they sign up. After signup they're sent
 * straight into the real player at /b/:id?t=<jwt>.
 */
export default function ListenInvite() {
  const { id } = useParams();
  const briefingId = id ?? "";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signInWithGoogle, signUpWithPassword, signInWithPassword } = useAuth();

  const token = useMemo(() => new URLSearchParams(location.search).get("t"), [location.search]);
  const playerHref = `/b/${briefingId}${token ? `?t=${token}` : ""}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [submitting, setSubmitting] = useState(false);

  // Fetch teaser via the same get-briefing edge function the player uses —
  // the JWT in `t` grants read-only access without an account.
  const { data, isLoading } = useQuery({
    queryKey: ["share-teaser", briefingId, token],
    queryFn: () => getBriefingForPlayer(briefingId, token),
    enabled: !!briefingId && !!token,
    staleTime: 60_000,
  });

  // If the visitor signs up / in successfully, send them straight to the player.
  useEffect(() => {
    if (user) navigate(playerHref, { replace: true });
  }, [user, navigate, playerHref]);

  const sectionTitles = data?.sections?.map((s) => s.title) ?? [];
  const minutes = data?.audio_duration_seconds
    ? Math.max(1, Math.round(data.audio_duration_seconds / 60))
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        await signUpWithPassword(email, password);
        toast.success("Account created — playing your briefing now");
      } else {
        await signInWithPassword(email, password);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign you in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between px-5 h-14">
          <Link to="/" className="flex items-center gap-2">
            <YoursLogo size={36} />
            <span className="text-base font-semibold tracking-tight">Yours</span>
          </Link>
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Already have an account? Sign in
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Teaser card */}
          <div className="yours-warm-gradient rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="h-4 w-4 text-white/80" />
              <p className="text-white/70 text-xs font-medium tracking-wider uppercase">
                Today's Briefing — shared with you
              </p>
            </div>
            <h1 className="text-2xl font-bold leading-tight mb-3">
              {isLoading
                ? "Loading…"
                : data
                  ? "A personalized audio briefing is waiting"
                  : "This briefing isn't available"}
            </h1>
            {data && (
              <div className="flex items-center gap-3 text-sm text-white/80 mb-4">
                {minutes && (
                  <span className="inline-flex items-center gap-1">
                    <Headphones className="h-3.5 w-3.5" /> {minutes} min
                  </span>
                )}
                {sectionTitles.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <ListMusic className="h-3.5 w-3.5" /> {sectionTitles.length} sections
                  </span>
                )}
              </div>
            )}
            {sectionTitles.length > 0 && (
              <ul className="space-y-1.5 text-white/85 text-sm">
                {sectionTitles.slice(0, 5).map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-white/60 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sign-up gate */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                {mode === "signup" ? "Create a free account to listen" : "Sign in to listen"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Yours is a free personalized audio briefing. {mode === "signup" ? "Sign up" : "Sign in"} and we'll start playing this briefing right away — plus you'll get your own each morning.
            </p>

            <Button
              variant="outline"
              className="w-full h-11 rounded-xl mb-3 text-sm font-medium"
              onClick={handleGoogle}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
              <Input
                type="password"
                placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
                required
                minLength={mode === "signup" ? 6 : undefined}
              />
              <Button type="submit" className="w-full h-11 rounded-xl" disabled={submitting}>
                {submitting
                  ? mode === "signup" ? "Creating..." : "Signing in..."
                  : (
                    <span className="inline-flex items-center gap-1.5">
                      {mode === "signup" ? "Sign up & listen" : "Sign in & listen"}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-3"
            >
              {mode === "signup"
                ? "Already have an account? Sign in instead"
                : "Don't have an account yet? Create one"}
            </button>

            <p className="text-center text-[11px] text-muted-foreground mt-4 leading-relaxed">
              By continuing you agree to our{" "}
              <Link to="/terms" className="text-foreground underline underline-offset-2">Terms</Link> and{" "}
              <Link to="/privacy" className="text-foreground underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>

          {/* Bottom hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>This share link expires in 30 days.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
