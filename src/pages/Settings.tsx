import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Trash2, Plus } from "lucide-react";
import { INTEREST_PACKAGES, RSS_PRESETS } from "@/types/database";
import { toast } from "sonner";

const TABS = ["Profile", "Interests", "Sources", "Audio"];

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState(0);
  const [name, setName] = useState(user?.full_name || "");
  const [deliveryTime, setDeliveryTime] = useState(user?.delivery_time || "07:00");
  const [tone, setTone] = useState(user?.tone || "upbeat");
  const [length, setLength] = useState(user?.preferred_length_minutes || 8);
  const [freeformInterests, setFreeformInterests] = useState("");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedRss, setSelectedRss] = useState<string[]>([]);
  const [customRss, setCustomRss] = useState("");

  const saveProfile = async () => {
    await updateProfile({ full_name: name, delivery_time: deliveryTime, tone: tone as "upbeat" | "calm" | "professional", preferred_length_minutes: length });
    toast.success("Settings saved");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-5 h-14">
          <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-5 w-5" strokeWidth={1.5} /></button>
          <h1 className="text-base font-semibold tracking-tight">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-xl">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${tab === i ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div><label className="text-sm font-medium mb-1.5 block">Name</label><Input value={name} onChange={e => setName(e.target.value)} className="h-11 rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Email</label><Input value={user?.email || ""} disabled className="h-11 rounded-xl bg-secondary" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Delivery time</label><Input type="time" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="h-11 rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Timezone</label><Input value={user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone} disabled className="h-11 rounded-xl bg-secondary" /></div>
            <Button onClick={saveProfile} className="w-full h-11 rounded-xl">Save changes</Button>
            <div className="pt-6 border-t border-border">
              <Button variant="destructive" className="w-full h-11 rounded-xl" onClick={() => toast.info("Account deletion coming soon")}><Trash2 className="h-4 w-4 mr-2" /> Delete account & data</Button>
            </div>
          </motion.div>
        )}

        {tab === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div><label className="text-sm font-medium mb-1.5 block">Your interests (freeform)</label><Textarea value={freeformInterests} onChange={e => setFreeformInterests(e.target.value)} placeholder="AI startups, 49ers, rock music..." className="rounded-xl resize-none" rows={3} /></div>
            <div>
              <label className="text-sm font-medium mb-3 block">Packages</label>
              <div className="grid grid-cols-2 gap-2">
                {INTEREST_PACKAGES.map(pkg => (
                  <button key={pkg.id} onClick={() => setSelectedPackages(prev => prev.includes(pkg.id) ? prev.filter(p => p !== pkg.id) : [...prev, pkg.id])} className={`p-3 rounded-xl border text-left transition-all ${selectedPackages.includes(pkg.id) ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                    <span className="text-lg">{pkg.icon}</span><p className="text-sm font-medium mt-1">{pkg.name}</p><p className="text-xs text-muted-foreground">{pkg.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => toast.success("Interests saved")} className="w-full h-11 rounded-xl">Save interests</Button>
          </motion.div>
        )}

        {tab === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">RSS feeds</label>
              <div className="space-y-2">
                {RSS_PRESETS.map(rss => (
                  <button key={rss.id} onClick={() => setSelectedRss(prev => prev.includes(rss.id) ? prev.filter(r => r !== rss.id) : [...prev, rss.id])} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedRss.includes(rss.id) ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}>
                    <span>{rss.icon}</span><div className="flex-1"><p className="text-sm font-medium">{rss.name}</p><p className="text-xs text-muted-foreground">{rss.category}</p></div>
                    {selectedRss.includes(rss.id) && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Custom RSS URL</label>
              <div className="flex gap-2">
                <Input value={customRss} onChange={e => setCustomRss(e.target.value)} placeholder="https://..." className="h-11 rounded-xl flex-1" />
                <Button size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={() => { if (customRss) toast.success("Feed added"); setCustomRss(""); }}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <label className="text-sm font-medium mb-3 block">Connected accounts</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border"><div className="flex items-center gap-2"><span className="text-sm">📧</span><span className="text-sm font-medium">Gmail</span></div><Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => toast.info("Gmail OAuth coming soon")}>Connect</Button></div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border"><div className="flex items-center gap-2"><span className="text-sm">📅</span><span className="text-sm font-medium">Google Calendar</span></div><Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => toast.info("Calendar OAuth coming soon")}>Connect</Button></div>
              </div>
            </div>
            <Button onClick={() => toast.success("Sources saved")} className="w-full h-11 rounded-xl">Save sources</Button>
          </motion.div>
        )}

        {tab === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-3 block">Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: "upbeat", label: "Upbeat", icon: "☀️" }, { id: "calm", label: "Calm", icon: "🧘" }, { id: "professional", label: "Pro", icon: "💼" }].map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} className={`p-3 rounded-xl border text-center transition-all ${tone === t.id ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}><span className="text-xl block mb-1">{t.icon}</span><p className="text-xs font-medium">{t.label}</p></button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-3 block">Length</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ min: 3, label: "3 min" }, { min: 8, label: "8 min" }, { min: 12, label: "12 min" }].map(l => (
                  <button key={l.min} onClick={() => setLength(l.min)} className={`p-3 rounded-xl border text-center transition-all ${length === l.min ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground/30"}`}><p className="text-sm font-semibold">{l.label}</p></button>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary"><p className="text-sm font-medium mb-1">Voice</p><p className="text-xs text-muted-foreground">Fish Audio TTS voice selection coming in v1.1</p></div>
            <Button onClick={saveProfile} className="w-full h-11 rounded-xl">Save preferences</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
