import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signUpWithPassword, signInWithMagicLink } = useAuth();

  // Redirect once signed in
  useEffect(() => {
    if (user) navigate(user.onboarding_complete ? "/app" : "/onboarding", { replace: true });
  }, [user, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [confirmSent, setConfirmSent] = useState(false);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUpWithPassword(email, password);
      // If email confirmation is disabled, onAuthStateChange will fire and
      // the useEffect redirect handles navigation. If enabled, show prompt.
      setConfirmSent(true);
    } catch (err) {
      console.error("[signup] password signup failed", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await signInWithMagicLink(email);
      setConfirmSent(true);
    } catch (err) {
      console.error("[signup] magic link failed", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("[signup] Google sign-in failed", err);
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-8">Start your personalized morning briefing</p>

        <div className="mb-4 space-y-1">
          <Button variant="outline" disabled className="w-full h-11 rounded-xl text-sm font-medium opacity-40 cursor-not-allowed">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Not available in this beta</p>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or</span></div>
        </div>

        {confirmSent ? (
          <div className="text-center py-8">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Check your email</p>
            <p className="text-sm text-muted-foreground">
              {mode === "magic"
                ? `We sent a sign-in link to ${email}`
                : `We sent a confirmation link to ${email}. Click it to activate your account.`}
            </p>
          </div>
        ) : mode === "password" ? (
          <form onSubmit={handlePassword} className="space-y-3">
            <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" required />
            <Input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" required minLength={6} />
            <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>{loading ? "Creating..." : "Get started free"}</Button>
            <button type="button" onClick={() => setMode("magic")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
              Use magic link instead
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" required />
            <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>{loading ? "Sending..." : "Send magic link"}</Button>
            <button type="button" onClick={() => setMode("password")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
              Use email &amp; password instead
            </button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          By signing up, you agree to our{" "}
          <Link to="/terms" className="text-foreground underline underline-offset-2">Terms of Service</Link> and{" "}
          <Link to="/privacy" className="text-foreground underline underline-offset-2">Privacy Policy</Link>.
        </p>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? <Link to="/login" className="text-foreground font-medium hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
