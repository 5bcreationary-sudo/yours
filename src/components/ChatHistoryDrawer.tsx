import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Clock, Search } from "lucide-react";
import { useState } from "react";

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  time: string;
  messages: number;
}

const mockSessions: ChatSession[] = [
  { id: "1", title: "Why we're losing to Acme", preview: "Based on your last 30 deals against Acme…", time: "12 min ago", messages: 4 },
  { id: "2", title: "Weekly competitive changes", preview: "Here's what moved this week…", time: "2 hrs ago", messages: 3 },
  { id: "3", title: "Rival.io call prep", preview: "Here's your quick battle card for Rival.io…", time: "Yesterday", messages: 6 },
  { id: "4", title: "BetaCo one-pager", preview: "BetaCo Overview: Founded 2019, Series B…", time: "Yesterday", messages: 2 },
  { id: "5", title: "Enterprise pricing objections", preview: "The top pricing objections we see are…", time: "2 days ago", messages: 8 },
  { id: "6", title: "Q1 win/loss patterns", preview: "Looking at Q1, the biggest shift was…", time: "3 days ago", messages: 5 },
  { id: "7", title: "Zenith free tier analysis", preview: "Zenith removing their free tier signals…", time: "1 week ago", messages: 3 },
];

export function ChatHistoryDrawer({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (session: ChatSession) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = mockSessions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.preview.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[320px] bg-card border-r border-border z-50 flex flex-col shadow-lg"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-primary-app tracking-tight">Chat History</h2>
              <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-primary-app transition-colors">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full h-[32px] rounded-lg bg-accent pl-8 pr-3 text-[12px] text-primary-app placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-2 pb-4">
              {filtered.map((session) => (
                <button
                  key={session.id}
                  onClick={() => { onSelect(session); onClose(); }}
                  className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent/60 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium text-primary-app truncate">{session.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate pl-5">{session.preview}</p>
                  <div className="flex items-center gap-2 mt-1 pl-5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/60" strokeWidth={1.5} />
                    <span className="text-[10px] text-muted-foreground/60">{session.time}</span>
                    <span className="text-[10px] text-muted-foreground/60">· {session.messages} messages</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
