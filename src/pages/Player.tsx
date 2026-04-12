import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Share, MicOff, Pause, Play } from "lucide-react";
import type { BriefingSection } from "@/types/database";

// Mock briefing data
const MOCK_SECTIONS: BriefingSection[] = [
  {
    id: "1", briefing_id: "demo", type: "weather", title: "Weather",
    summary: "Sunny skies today in San Francisco, high of 72°F with light winds from the west. Perfect for your outdoor lunch meeting at Dolores Park this afternoon.",
    card_payload: null, order: 0, duration_minutes: 1,
  },
  {
    id: "2", briefing_id: "demo", type: "calendar", title: "Calendar",
    summary: "You have three meetings today:",
    card_payload: {
      items: [
        "10:00 AM — Design review with the product team. They'll want to see the new mockups you've been working on.",
        "1:00 PM — Investor call with Sequoia. Prep your Q1 metrics and growth chart before this one.",
        "3:00 PM — Team standup. Quick sync, should be under 15 minutes.",
      ],
    },
    order: 1, duration_minutes: 1.5,
  },
  {
    id: "3", briefing_id: "demo", type: "emails", title: "Emails",
    summary: "Two important emails overnight:",
    card_payload: {
      items: [
        "Your CEO sent board deck feedback — mostly positive, wants to adjust the TAM slide and add a competitive landscape section.",
        "A partnership proposal from Acme Corp arrived. Looks worth reviewing — they're offering co-marketing for Q2.",
      ],
    },
    order: 2, duration_minutes: 1.5,
  },
  {
    id: "4", briefing_id: "demo", type: "news", title: "AI & Tech",
    summary: "Big day in artificial intelligence:",
    card_payload: {
      items: [
        "OpenAI announced GPT-5 turbo with a 2x context window and significantly improved reasoning capabilities.",
        "Anthropic closed another $2B funding round, bringing their total valuation to $28 billion.",
        "Y Combinator's latest batch had 12 AI-native startups — three are building in your space.",
      ],
    },
    order: 3, duration_minutes: 2,
  },
  {
    id: "5", briefing_id: "demo", type: "sports", title: "49ers",
    summary: "NFL news:",
    card_payload: {
      items: [
        "The 49ers signed a new wide receiver from the draft yesterday. Preseason kicks off in 3 weeks.",
        "Brock Purdy's throwing arm is looking sharp in OTAs according to beat reporters covering Santa Clara.",
      ],
    },
    order: 4, duration_minutes: 1,
  },
];

export default function Player() {
  const { briefingId } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const speeds = [1, 1.25, 1.5, 2];

  const cycleSpeed = () => {
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const sections = MOCK_SECTIONS;
  const activeSection = sections[activeSectionIndex];

  return (
    <div className="min-h-screen yours-warm-gradient flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-3 pt-5">
        <Link
          to="/app"
          className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-white/90" strokeWidth={1.5} />
        </Link>
        <h1 className="text-white text-lg font-bold tracking-tight">Yours</h1>
        <button className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
          <Share className="h-4.5 w-4.5 text-white/90" strokeWidth={1.5} />
        </button>
      </div>

      {/* Section tabs */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveSectionIndex(i)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === activeSectionIndex
                  ? "bg-white/25 text-white"
                  : "bg-white/10 text-white/60 hover:text-white/80"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <motion.div
          key={activeSectionIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Section title */}
          <p className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-4">
            {activeSection.title}
          </p>

          {/* Summary text — large, bold, readable */}
          <p className="text-white text-[22px] font-bold leading-[1.45] tracking-[-0.01em] mb-6">
            {activeSection.summary}
          </p>

          {/* Card items as bullet points */}
          {activeSection.card_payload?.items && (
            <div className="space-y-5">
              {(activeSection.card_payload.items as string[]).map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-2 shrink-0 h-3 w-3 rounded-full border-2 border-white/40" />
                  <p className="text-white/85 text-[17px] font-medium leading-[1.5]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom fixed controls */}
      <div className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom,20px)] pb-6 pt-4 px-6">
        <div className="yours-warm-gradient" />
        <div className="flex items-center justify-between max-w-[480px] mx-auto relative">
          {/* Speed button */}
          <button
            onClick={cycleSpeed}
            className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <span className="text-white text-sm font-semibold">{speed}x</span>
          </button>

          {/* Center Join button */}
          <button className="h-12 px-8 rounded-full bg-white flex items-center gap-2 shadow-lg">
            <MicOff className="h-4 w-4 text-neutral-800" strokeWidth={2} />
            <span className="text-neutral-800 text-sm font-semibold">Join</span>
          </button>

          {/* Play/Pause button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" fill="white" strokeWidth={0} />
            ) : (
              <Play className="h-5 w-5 text-white ml-0.5" fill="white" strokeWidth={0} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
