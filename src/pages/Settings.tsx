import { useState } from "react";
import { motion } from "framer-motion";
import { User, Building, Users, CreditCard, Bell, Key, Database } from "lucide-react";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API", icon: Key },
  { id: "data", label: "Data", icon: Database },
];

export default function SettingsPage() {
  const [active, setActive] = useState("profile");

  return (
    <div className="px-6 py-8 max-w-[860px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-primary-app mb-6">Settings</h1>

        <div className="flex gap-8">
          {/* Sub-nav */}
          <div className="w-[180px] shrink-0 space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2 w-full rounded-[10px] px-3 py-2 text-sm transition-colors ${
                  active === s.id
                    ? "bg-accent text-primary-app font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-primary-app"
                }`}
              >
                <s.icon className="h-[15px] w-[15px]" strokeWidth={1.5} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {active === "profile" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-medium text-primary-app tracking-tight mb-4">Profile</h2>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-[56px] w-[56px] rounded-full bg-accent flex items-center justify-center text-lg font-semibold text-muted-foreground">
                      JD
                    </div>
                    <button className="text-sm text-muted-foreground hover:text-primary-app transition-colors">Change avatar</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Full name</label>
                    <input defaultValue="Jane Doe" className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Email</label>
                    <input defaultValue="jane@company.com" className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Team</label>
                    <select className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring">
                      <option>Sales</option>
                      <option>Product</option>
                      <option>Marketing</option>
                      <option>Executive</option>
                    </select>
                  </div>
                </div>
                <button className="rounded-[10px] bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity">
                  Save Changes
                </button>
              </div>
            )}

            {active === "organization" && (
              <div className="space-y-5">
                <h2 className="text-lg font-medium text-primary-app tracking-tight mb-4">Organization</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Organization name</label>
                    <input defaultValue="Acme Inc" className="w-full h-[40px] rounded-[10px] bg-accent px-4 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">What does your company do?</label>
                    <textarea defaultValue="We build competitive intelligence software for B2B SaaS companies." className="w-full h-[80px] rounded-[10px] bg-accent px-4 py-2.5 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Key competitive advantage</label>
                    <textarea defaultValue="AI-powered analysis combining external intel with internal deal data." className="w-full h-[80px] rounded-[10px] bg-accent px-4 py-2.5 text-sm text-primary-app focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                  </div>
                </div>
                <button className="rounded-[10px] bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity">Save</button>
              </div>
            )}

            {active === "billing" && (
              <div className="space-y-5">
                <h2 className="text-lg font-medium text-primary-app tracking-tight mb-4">Billing</h2>
                <div className="surface-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-primary-app">Growth Plan</h3>
                      <p className="text-[11px] text-muted-foreground">$599/month · Renews Mar 15, 2026</p>
                    </div>
                    <button className="rounded-[10px] border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-primary-app transition-colors">
                      Manage Plan
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Competitors</p>
                      <p className="text-sm font-medium text-primary-app">5 / 15</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Users</p>
                      <p className="text-sm font-medium text-primary-app">3 / 10</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Playbooks</p>
                      <p className="text-sm font-medium text-primary-app">8 / ∞</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!["profile", "organization", "billing"].includes(active) && (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">
                  {active === "team" && "Invite and manage your team members here."}
                  {active === "notifications" && "Configure your email notification preferences."}
                  {active === "api" && "Manage API keys for programmatic access. Available on Pro plan."}
                  {active === "data" && "Export your organization data or manage account deletion."}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 italic">Coming soon — Hugo is still setting this up.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
