import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Headphones, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/onboarding");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[380px]"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center">
              <Headphones className="h-5 w-5 text-background" strokeWidth={2} />
            </div>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-primary-app">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start getting your personalized morning briefing</p>
        </div>

        <button
          onClick={() => navigate("/onboarding")}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-primary-app hover:bg-accent transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--blue-accent))] focus:border-transparent transition-all"
          />
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--blue-accent))] focus:border-transparent transition-all"
          />
          <input
            type="tel"
            placeholder="Phone number (for SMS delivery)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--blue-accent))] focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-foreground text-background px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Creating account…" : "Create Account"}
            {!loading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[hsl(var(--blue-accent))] hover:underline font-medium">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
