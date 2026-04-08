import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Paperclip, ThumbsUp, ThumbsDown, BookOpen, FileText, Share2, Clock, Image, RefreshCw, History } from "lucide-react";
import { HugoMark } from "@/components/HugoMark";
import { ThinkingAnimation } from "@/components/ThinkingAnimation";
import { consumeChatPrefill } from "@/hooks/use-chat-fork";
import { ChatHistoryDrawer } from "@/components/ChatHistoryDrawer";

interface Message {
  id: number;
  role: "user" | "hugo";
  content: string;
  sources?: string[];
}

const suggestedPrompts = [
  { text: "Why are we losing to Acme Corp?", icon: BookOpen },
  { text: "What changed with our competitors this week?", icon: RefreshCw },
  { text: "Prep me for a call against Rival.io", icon: FileText },
  { text: "Generate a one-pager on BetaCo", icon: Share2 },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle prefill from dashboard fork
  useEffect(() => {
    const prefill = consumeChatPrefill();
    if (prefill) {
      // Small delay to let component mount
      setTimeout(() => handleSend(prefill), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const charCount = input.length;

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isStreaming) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    setTimeout(() => {
      const resp = getDemoResponse(msg);
      const hugoMsg: Message = {
        id: Date.now() + 1,
        role: "hugo",
        content: resp,
        sources: ["Gong call transcript, Jan 8", "Acme pricing page, 3 days ago"],
      };
      setMessages((prev) => [...prev, hugoMsg]);
      setIsStreaming(false);
    }, 4000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] max-w-[820px] mx-auto w-full relative">
      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={(session) => {
          setMessages([
            { id: 1, role: "user", content: session.title },
            { id: 2, role: "hugo", content: session.preview + "\n\n(Previous session loaded)", sources: ["Session history"] },
          ]);
        }}
      />
      {/* Mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(210,100%,85%)] opacity-25 blur-[160px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[450px] h-[450px] rounded-full bg-[hsl(200,80%,88%)] opacity-20 blur-[140px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-[hsl(220,70%,90%)] opacity-15 blur-[130px]" />
        <div className="absolute bottom-[30%] right-[20%] w-[350px] h-[350px] rounded-full bg-[hsl(195,70%,87%)] opacity-18 blur-[120px]" />
      </div>
      {/* Messages or empty state */}
      <div className="flex-1 overflow-auto px-6 relative z-10">
        {/* History toggle */}
        <button
          onClick={() => setHistoryOpen(true)}
          className="absolute top-4 left-6 z-20 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary-app hover:bg-accent transition-colors"
        >
          <History className="h-3.5 w-3.5" strokeWidth={1.5} />
          History
        </button>
        {isEmpty ? (
          <div className="flex flex-col items-start justify-center h-full pb-32 max-w-[660px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <h1 className="text-3xl font-semibold tracking-tight text-primary-app leading-tight">
                {getGreeting()}, Jane
              </h1>
              <h2 className="text-3xl font-semibold tracking-tight text-muted-foreground leading-tight">
                What would you like to know?
              </h2>
              <p className="text-sm text-muted-foreground mt-3">
                Use one of the most common prompts below or use your own to begin
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-8 w-full">
                {suggestedPrompts.map(({ text, icon: Icon }) => (
                  <button
                    key={text}
                    onClick={() => handleSend(text)}
                    className="flex flex-col justify-between text-left rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground hover:text-primary-app hover:border-foreground/15 transition-all leading-snug min-h-[100px] group"
                  >
                    <span className="line-clamp-3">{text}</span>
                    <Icon className="h-4 w-4 mt-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" strokeWidth={1.5} />
                  </button>
                ))}
              </div>

              <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary-app transition-colors mt-3">
                <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                Refresh Prompts
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6 py-6 max-w-[660px] mx-auto">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-accent px-5 py-3 text-sm text-primary-app leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <HugoMark size={18} />
                      <span className="text-[11px] text-muted-foreground font-medium">Hugo</span>
                    </div>
                    <div className="text-sm text-primary-app leading-[1.7] whitespace-pre-line">
                      {msg.content}
                    </div>
                    {msg.sources && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {msg.sources.map((s) => (
                          <span
                            key={s}
                            className="text-[11px] text-muted-foreground bg-accent rounded-full px-2.5 py-0.5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-3">
                      {[
                        { icon: BookOpen, label: "Save as Playbook" },
                        { icon: FileText, label: "Export PDF" },
                        { icon: Share2, label: "Send to Slack" },
                      ].map(({ icon: Icon, label }) => (
                        <button
                          key={label}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-primary-app transition-colors"
                        >
                          <Icon className="h-[12px] w-[12px]" strokeWidth={1.5} />
                          {label}
                        </button>
                      ))}
                      <div className="ml-auto flex items-center gap-0.5">
                        <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary-app transition-colors">
                          <ThumbsUp className="h-[13px] w-[13px]" strokeWidth={1.5} />
                        </button>
                        <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary-app transition-colors">
                          <ThumbsDown className="h-[13px] w-[13px]" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ThinkingAnimation />
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 pb-5 pt-2 max-w-[660px] mx-auto w-full">
        <div className="rounded-2xl border border-border bg-card focus-within:border-foreground/15 transition-colors">
          <div className="flex items-center px-4 pt-3 pb-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask whatever you want..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-primary-app placeholder:text-muted-foreground focus:outline-none leading-relaxed max-h-[96px] py-0.5"
            />
          </div>
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-primary-app transition-colors rounded-lg hover:bg-accent">
                <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
                Add Attachment
              </button>
              <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-primary-app transition-colors rounded-lg hover:bg-accent">
                <Image className="h-3.5 w-3.5" strokeWidth={1.5} />
                Use Image
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{charCount}/1000</span>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="h-[28px] w-[28px] rounded-full bg-foreground flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-20 shrink-0"
              >
                <ArrowUp className="h-[13px] w-[13px] text-background" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDemoResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("losing") || lower.includes("loss"))
    return "Based on your last 30 deals against Acme, here are the top 3 loss reasons:\n\n1. Missing mobile app — 42% of losses. This is the #1 objection in 12 of your last 15 lost enterprise deals.\n\n2. Slower onboarding — 28%. Prospects report 3x longer time-to-value compared to Acme's guided setup.\n\n3. Price perception in mid-market — 18%. Even though your TCO is comparable, the sticker price loses deals.\n\nI'd prioritize the mobile gap — it's costing you the most deals by far.";
  if (lower.includes("changed") || lower.includes("week"))
    return "Here's what moved this week:\n\n🔴 Acme raised enterprise pricing by 20% — no new features announced.\n\n🔴 Rival.io launched an AI assistant feature on Product Hunt.\n\n🟡 BetaCo posted 8 new enterprise AE positions in EMEA.\n\n🟡 Zenith removed their free tier entirely.\n\nThe Acme pricing change is the biggest opportunity — want me to draft a targeted outreach campaign?";
  if (lower.includes("prep") || lower.includes("call"))
    return "Here's your quick battle card for Rival.io:\n\n**Their strengths:**\n• Strong G2 reviews (4.5★, 340 reviews)\n• Native Salesforce integration\n• Recently launched AI assistant\n\n**Their weaknesses:**\n• No real-time alerting\n• Limited to 5 competitors on base plan\n• Multiple complaints about data freshness\n\n**Your play:**\nLead with real-time intel advantage and unlimited competitor tracking.";
  if (lower.includes("one-pager") || lower.includes("generate"))
    return "I'll generate a one-pager on BetaCo:\n\n**BetaCo Overview**\nFounded 2019 · Series B ($45M) · ~200 employees · HQ: Austin\n\n**Positioning:** Mid-market CI platform focused on automated monitoring\n\n**Key strengths:** Affordable pricing, good for small teams\n\n**Key weaknesses:** High engineering turnover, no AI features\n\n**Hugo Score:** 61/100 (moderate activity, declining momentum)\n\nWant me to export this as a PDF?";
  return "Interesting question. I can help with:\n\n• Competitive positioning against any tracked competitor\n• Deal prep and battle cards\n• Win/loss pattern analysis\n• Recent competitive movements\n\nJust ask — I'm here to help you win.";
}
