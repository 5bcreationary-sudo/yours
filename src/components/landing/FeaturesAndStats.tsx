import { motion } from "framer-motion";
import {
  Calendar,
  CloudSun,
  Headphones,
  List,
  Mail,
  MessageSquare,
  Mic,
  Share2,
  Smartphone,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "5 min", label: "Daily briefing" },
  { value: "100%", label: "Personalized" },
  { value: "2", label: "Natural host voices" },
  { value: "0", label: "Apps to install" },
];

interface FeatureBullet {
  icon: LucideIcon;
  text: string;
}

interface Feature {
  kicker: string;
  title: string;
  body: string;
  bullets: FeatureBullet[];
  /** Mockup composition rendered as the visual for this row. */
  Visual: () => JSX.Element;
}

function PodcastMock() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-secondary">
          <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Two-host podcast
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium">
          <span className="h-2 w-2 rounded-full bg-foreground" /> Charon
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium">
          <span className="h-2 w-2 rounded-full bg-orange-400" /> Achernar
        </span>
      </div>

      <div className="flex items-end gap-1 h-16">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.span
            key={i}
            animate={{
              scaleY: [
                0.3 + (i % 5) * 0.1,
                0.6 + ((i * 7) % 5) * 0.1,
                0.4 + (i % 4) * 0.12,
                0.8 + ((i * 3) % 4) * 0.05,
              ],
            }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }}
            className={`block w-1 rounded-full origin-bottom ${i % 2 === 0 ? "bg-foreground/80" : "bg-orange-400/80"}`}
            style={{ height: 40 }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>1:24</span>
        <span>5:38</span>
      </div>
    </div>
  );
}

function PersonalizedMock() {
  return (
    <div className="space-y-2">
      {[
        { icon: CloudSun, kicker: "Weather", title: "72° · partly cloudy", body: "Light wind, perfect for the 1pm meeting" },
        { icon: Calendar, kicker: "Calendar", title: "Standup at 10:00", body: "Then design review · 1:1 with Priya" },
        { icon: Mail, kicker: "Inbox", title: "3 important emails", body: "From Anthropic, Stripe, and your CFO" },
      ].map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.kicker} className="rounded-xl border border-border bg-card p-3.5 flex items-start gap-3">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-secondary shrink-0">
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tile.kicker}</p>
              <p className="text-sm font-semibold mt-0.5">{tile.title}</p>
              <p className="text-xs text-muted-foreground leading-snug truncate">{tile.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChaptersMock() {
  const chapters = [
    { i: 1, title: "Weather", time: "0:00", active: false },
    { i: 2, title: "Today's calendar", time: "0:24", active: true },
    { i: 3, title: "News headlines", time: "0:46", active: false },
    { i: 4, title: "Sports", time: "1:12", active: false },
    { i: 5, title: "For you", time: "1:32", active: false },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Chapters</p>
        <List className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <ul className="space-y-1">
        {chapters.map((c) => (
          <li
            key={c.i}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${c.active ? "bg-secondary" : ""}`}
          >
            <span
              className={`h-7 w-7 shrink-0 rounded-full inline-flex items-center justify-center text-[11px] font-bold tabular-nums ${
                c.active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              }`}
            >
              {c.i}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${c.active ? "text-foreground" : "text-muted-foreground"}`}>
                {c.title}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums">{c.time}</p>
            </div>
            {c.active && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Playing
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SmsMock() {
  return (
    <div className="relative rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-secondary">
          <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Yours</p>
          <p className="text-[11px] text-muted-foreground leading-tight">Text · 7:00 AM</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5 max-w-[88%]">
          <p className="text-sm leading-snug">Good morning ☀️ Your briefing is ready.</p>
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5 max-w-[88%] inline-flex items-center gap-2">
          <Headphones className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="text-sm leading-snug font-medium underline underline-offset-2">yours.fm/b/abc123</span>
        </div>
      </div>
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    kicker: "Sounds like a podcast",
    title: "Two natural hosts, talking just to you.",
    body: "Charon and Achernar walk through your morning together — banter, follow-ups, real reactions. Not a robot reading a script.",
    bullets: [
      { icon: Mic, text: "Two voices, real chemistry" },
      { icon: Users, text: "Different tones to match your day" },
      { icon: Headphones, text: "Studio-grade audio you'll actually finish" },
    ],
    Visual: PodcastMock,
  },
  {
    kicker: "Personalized to your day",
    title: "Your weather, your inbox, your calendar.",
    body: "Connect Gmail and Google Calendar and we fold them in. Tell us your interests once and the briefing tailors itself every morning.",
    bullets: [
      { icon: Mail, text: "Inbox highlights, not full digests" },
      { icon: Calendar, text: "Today's meetings, in plain English" },
      { icon: CloudSun, text: "Weather that knows your zip code" },
    ],
    Visual: PersonalizedMock,
  },
  {
    kicker: "Skim or listen",
    title: "Chapters, transcripts, and section share links.",
    body: "Hop between weather, calendar, and news instantly. Share a single section to a friend with one tap.",
    bullets: [
      { icon: List, text: "Tap any chapter to jump in" },
      { icon: Share2, text: "Section-level share links" },
      { icon: Headphones, text: "Lock-screen controls on iPhone & Android" },
    ],
    Visual: ChaptersMock,
  },
  {
    kicker: "No app, just a text",
    title: "We text you when it's ready. Tap to listen.",
    body: "No App Store gatekeeping. No notification fatigue. Just a single SMS at your briefing time with a link that plays anywhere.",
    bullets: [
      { icon: Smartphone, text: "Works on every phone" },
      { icon: MessageSquare, text: "One message, no spam" },
      { icon: Headphones, text: "AirPods, car stereo, browser — all good" },
    ],
    Visual: SmsMock,
  },
];

export function FeaturesAndStats() {
  return (
    <section id="features" className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border mb-20 md:mb-28">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-background p-6 text-center"
            >
              <p className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Alternating-row features */}
        <div className="space-y-24 md:space-y-32">
          {FEATURES.map((feature, i) => {
            const visualLeft = i % 2 === 1;
            const Visual = feature.Visual;
            return (
              <div
                key={feature.title}
                className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
              >
                {/* Visual */}
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={visualLeft ? "lg:order-1" : "lg:order-2"}
                >
                  <Visual />
                </motion.div>

                {/* Copy */}
                <motion.div
                  initial={{ opacity: 0, x: visualLeft ? 24 : -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={visualLeft ? "lg:order-2" : "lg:order-1"}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                    {feature.kicker}
                  </p>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-[1.1] mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-5 max-w-md">
                    {feature.body}
                  </p>
                  <ul className="space-y-2.5">
                    {feature.bullets.map((b) => {
                      const Icon = b.icon;
                      return (
                        <li key={b.text} className="flex items-start gap-3">
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-secondary shrink-0">
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </span>
                          <span className="text-sm leading-relaxed pt-1">{b.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
