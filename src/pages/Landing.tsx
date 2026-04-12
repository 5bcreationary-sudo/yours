import { motion } from "framer-motion";
import { ArrowRight, Headphones, Zap, Clock, Mic, Shield, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Clock, title: "5-minute morning brief", desc: "Weather, calendar, emails, and news — all in one listen." },
  { icon: Smartphone, title: "SMS-first delivery", desc: "No app to download. Get a text, tap to listen." },
  { icon: Mic, title: "Natural conversation", desc: "Two AI hosts discuss your day like a podcast." },
  { icon: Zap, title: "Hyper-personalized", desc: "Your interests, your sources, your schedule." },
  { icon: Shield, title: "Private by default", desc: "Your data stays yours. Delete anytime." },
  { icon: Headphones, title: "Works everywhere", desc: "Mobile browser, car, AirPods — no app needed." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="text-base font-semibold tracking-tight">Yours</span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="text-sm font-medium bg-foreground text-background px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground mb-6">
              <Headphones className="h-3.5 w-3.5" /> Now in beta
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.1] mb-5">
              Your morning,<br />perfectly briefed.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
              A personalized audio briefing delivered to your phone every morning. Weather, calendar, emails, news — all in one 5-minute listen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                onClick={() => navigate("/signup")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto bg-foreground text-background px-8 py-3 rounded-full text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </motion.button>
              <button
                onClick={() => navigate("/b/demo")}
                className="w-full sm:w-auto text-sm text-muted-foreground hover:text-foreground transition-colors px-6 py-3"
              >
                Listen to a sample →
              </button>
            </div>
          </motion.div>

          {/* Mock phone */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-[280px] mx-auto"
          >
            <div className="yours-warm-gradient rounded-[2rem] p-6 pt-10 pb-8 shadow-2xl shadow-orange-900/20">
              <div className="text-center mb-6">
                <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Briefing</p>
                <p className="text-white text-lg font-bold mt-1">Good morning ☀️</p>
              </div>
              <div className="space-y-3 text-white/90 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white/50 mt-0.5">○</span>
                  <span>72°F and sunny — perfect for your 1pm outdoor meeting</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white/50 mt-0.5">○</span>
                  <span>3 meetings today, first at 10am</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white/50 mt-0.5">○</span>
                  <span>OpenAI announced GPT-5 turbo</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs text-white/80 font-medium">1x</div>
                <div className="h-12 w-20 rounded-full bg-white flex items-center justify-center">
                  <span className="text-orange-800 text-xs font-semibold">▶ Play</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white/80 text-xs">⏸</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold tracking-tight mb-3">Everything you need to hear, nothing you don't.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Replace morning scrolling with a personalized audio briefing tailored to your life.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <f.icon className="h-5 w-5 text-foreground mb-3" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Start your mornings right.</h2>
          <p className="text-muted-foreground mb-8">Free to start. No app required. Cancel anytime.</p>
          <button
            onClick={() => navigate("/signup")}
            className="bg-foreground text-background px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 Yours</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
