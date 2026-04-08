import { Upload, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

const syncs = [
  { name: "HubSpot CRM", status: "synced", lastSync: "2 hours ago", deals: 142 },
  { name: "Salesforce", status: "not_connected", lastSync: "—", deals: 0 },
  { name: "Gong", status: "synced", lastSync: "4 hours ago", deals: 87 },
];

export function UploadSync() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV upload */}
        <div className="bg-card rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center hover:border-[hsl(var(--blue-accent)/0.4)] transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--blue-accent-light))] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload className="h-5 w-5 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-primary-app">Upload CRM Export</p>
          <p className="text-[11px] text-muted-foreground mt-1">HubSpot or Salesforce CSV · Max 10MB</p>
        </div>

        {/* Gong upload */}
        <div className="bg-card rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center hover:border-[hsl(var(--blue-accent)/0.4)] transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--blue-accent-light))] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload className="h-5 w-5 text-[hsl(var(--blue-accent))]" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-primary-app">Upload Gong Transcripts</p>
          <p className="text-[11px] text-muted-foreground mt-1">Tie transcripts to specific deals</p>
        </div>
      </div>

      {/* Sync status */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Integration Status</h3>
          <button className="flex items-center gap-1 text-[11px] text-[hsl(var(--blue-accent))] font-medium hover:opacity-70 transition-opacity">
            <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
            Sync All
          </button>
        </div>
        {syncs.map((s) => (
          <div key={s.name} className="px-5 py-3 flex items-center justify-between border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              {s.status === "synced" ? (
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--urgency-low))]" strokeWidth={1.5} />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              )}
              <div>
                <p className="text-sm font-medium text-primary-app">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">Last sync: {s.lastSync}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {s.deals > 0 && <span className="text-[11px] text-muted-foreground">{s.deals} deals</span>}
              <button className={`text-[11px] font-medium rounded-lg px-3 py-1.5 transition-colors ${
                s.status === "synced"
                  ? "text-muted-foreground border border-border hover:bg-accent"
                  : "text-[hsl(var(--blue-accent))] bg-[hsl(var(--blue-accent-light))] hover:opacity-80"
              }`}>
                {s.status === "synced" ? "Re-sync" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
