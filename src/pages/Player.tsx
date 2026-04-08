import { useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Play, Pause, SkipBack, SkipForward, Volume2, Download, MessageSquare, ChevronDown, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const chapters = [
  { emoji: "☀️", label: "Weather", time: "0:00", duration: "1:12", text: "Sunny skies today in San Francisco, high of 72°F with light winds. Perfect for your outdoor lunch meeting at Dolores Park. Evening drops to 58°F — grab a light jacket." },
  { emoji: "🚗", label: "Commute", time: "1:12", duration: "1:18", text: "22 minutes via 101 this morning — light traffic. There's construction on Market St so take Mission instead if heading downtown. Leave by 8:15 to make your 9am." },
  { emoji: "📅", label: "Calendar", time: "2:30", duration: "1:15", text: "Three meetings today. 10am design review with the product team — they'll want to see the new mockups. 1pm investor call with Sequoia — prep your Q1 metrics. 3pm team standup." },
  { emoji: "📧", label: "Emails", time: "3:45", duration: "1:25", text: "Two important emails overnight. Your CEO sent board deck feedback — mostly positive, wants to adjust the TAM slide. And a partnership proposal from Acme Corp worth reviewing." },
  { emoji: "🤖", label: "AI Startups", time: "5:10", duration: "1:50", text: "Big day in AI. OpenAI announced GPT-5 turbo with 2x context window. Anthropic closed another $2B round. Y Combinator's latest batch had 12 AI-native startups — three in your space." },
  { emoji: "🏈", label: "49ers", time: "7:00", duration: "1:12", text: "The 49ers signed wide receiver from the draft yesterday. Preseason kicks off in 3 weeks. Brock Purdy's throwing arm is looking sharp in OTAs according to beat reporters." },
];

export default function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [progress, setProgress] = useState(38);
  const [speed, setSpeed] = useState(1);
  const [showChat, setShowChat] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[480px] mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary-app transition-colors">
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center">
              <Headphones className="h-3 w-3 text-background" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold text-primary-app">Yours</span>
          </div>
          <button className="text-muted-foreground hover:text-primary-app transition-colors">
            <Download className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-4 py-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-xl font-semibold tracking-tight text-primary-app">Today's Briefing</h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> 8 min · Wednesday, April 8, 2026
          </p>
        </motion.div>

        {/* Waveform / Progress */}
        <div className="mb-2">
          <div className="h-2 w-full bg-accent rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setProgress(((e.clientX - rect.left) / rect.width) * 100);
          }}>
            <motion.div
              className="h-full bg-[hsl(var(--blue-accent))] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">3:02</span>
            <span className="text-[10px] text-muted-foreground">8:12</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 py-4">
          <button className="text-muted-foreground hover:text-primary-app transition-colors">
            <SkipBack className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-14 w-14 rounded-full bg-foreground flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.4)] transition-shadow"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-background" fill="currentColor" />
            ) : (
              <Play className="h-6 w-6 text-background ml-0.5" fill="currentColor" />
            )}
          </button>
          <button className="text-muted-foreground hover:text-primary-app transition-colors">
            <SkipForward className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Speed & Volume */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button className="text-muted-foreground hover:text-primary-app transition-colors">
            <Volume2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-1">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  speed === s
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-1">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Chapters</h2>
          {chapters.map((ch, i) => (
            <motion.button
              key={ch.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveChapter(i)}
              className={`w-full text-left rounded-xl px-4 py-3 transition-all ${
                i === activeChapter
                  ? "bg-[hsl(var(--blue-accent-light))] border border-[hsl(var(--blue-accent)/0.2)]"
                  : "hover:bg-accent border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base shrink-0">{ch.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary-app">{ch.label}</span>
                    <span className="text-[10px] text-muted-foreground">{ch.time}</span>
                  </div>
                  {i === activeChapter && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-muted-foreground leading-relaxed mt-1.5"
                    >
                      {ch.text}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Chat bubble */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setShowChat(!showChat)}
            className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.4)] transition-shadow"
          >
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute bottom-16 right-0 w-[320px] rounded-2xl border border-border bg-card shadow-[0_8px_40px_-8px_rgba(0,0,0,0.2)] overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium text-primary-app">Ask about this briefing</span>
                <button onClick={() => setShowChat(false)}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 min-h-[160px] flex items-end">
                <input
                  type="text"
                  placeholder="e.g. Tell me more about the Anthropic raise..."
                  className="w-full rounded-xl border border-border bg-accent px-4 py-2.5 text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--blue-accent))] transition-all"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
