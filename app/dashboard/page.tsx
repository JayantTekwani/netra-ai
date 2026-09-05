// app/dashboard/page.tsx (No Sidebar - Full Width Bento)
export default function DashboardPage() {
  return (
    // MAIN WRAPPER: NO SIDEBAR OFFSET. Full width, full height.
    <div className="min-h-screen bg-background text-foreground p-6">
      
      {/* ============================================ */}
      {/* TOP HEADER + HORIZONTAL NAVIGATION (Replaces Sidebar) */}
      {/* ============================================ */}
      <header className="border-b border-border/50 pb-4 mb-6">
        
        {/* Row 1: Agency Branding + Threat Level */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
              MHA
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Command Briefing: <span className="text-primary">AI Platform</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {new Date().toLocaleString('en-IN', { 
                  timeZone: 'IST', 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} IST
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Threat Index</span>
            <span className="px-4 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold animate-pulse">
              ● MODERATE
            </span>
          </div>
        </div>

        {/* Row 2: Horizontal Navigation (The items that used to be in the sidebar) */}
        <nav className="flex items-center gap-1 flex-wrap">
          {[
            'Dashboard', 
            'Cases', 
            'Surveillance', 
            'Audit & Custody', 
            'Upload Data', 
            'Investigation', 
            'Timeline', 
            'Settings'
          ].map((item, index) => (
            <a
              key={item}
              href="#"
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                index === 0 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      {/* ============================================ */}
      {/* MAIN GRID - 12 Columns (FULL WIDTH - No Sidebar) */}
      {/* ============================================ */}
      <div className="grid grid-cols-12 gap-5">

        {/* --- ROW 1: LEFT (col-span-8) = GRAPH --- */}
        <div className="col-span-12 lg:col-span-8 bg-secondary/30 rounded-2xl border border-border/50 p-4 min-h-[360px] relative">
          {/* Floating Stats */}
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Entity Relationship Map
            </h3>
            <div className="flex gap-2 text-[10px]">
              <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full font-bold text-primary">4 Cases</span>
              <span className="px-3 py-1 bg-secondary border border-border rounded-full">6 Entities</span>
              <span className="px-3 py-1 bg-secondary border border-border rounded-full">4 Links</span>
            </div>
          </div>
          {/* Graph Placeholder */}
          <div className="w-full h-[280px] mt-2 bg-gradient-to-br from-primary/5 via-transparent to-secondary/20 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-muted-foreground text-sm">
            [ Your Network Graph (D3 / Vis.js / React Flow) ]
          </div>
          {/* Mini Legend */}
          <div className="absolute bottom-4 left-4 flex gap-3 text-[9px] text-muted-foreground bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"></span> Person</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1"></span> Device</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1"></span> Account</span>
          </div>
        </div>

        {/* --- ROW 1: RIGHT (col-span-4) = ALERTS --- */}
        <div className="col-span-12 lg:col-span-4 bg-card rounded-2xl border border-border/50 p-4 flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between items-center mb-3">
            <span>🚨 Threat Alerts</span>
            <span className="text-[9px] bg-secondary px-2 py-0.5 rounded-full">Live</span>
          </h3>
          <div className="space-y-2.5 overflow-y-auto max-h-[320px]">
            {/* Alert 1 */}
            <div className="p-3 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex justify-between"><h4 className="text-xs font-bold text-red-400">Cross-border travel</h4><span className="text-[9px] text-muted-foreground">2h ago</span></div>
              <p className="text-xs text-foreground/70 mt-0.5">Two subjects boarded flights arriving same destination 2 hrs apart.</p>
              <button className="text-[10px] font-bold text-primary mt-1 hover:underline">Assign →</button>
            </div>
            {/* Alert 2 */}
            <div className="p-3 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg">
              <div className="flex justify-between"><h4 className="text-xs font-bold text-orange-400">TOR traffic spike</h4><span className="text-[9px] text-muted-foreground">45m ago</span></div>
              <p className="text-xs text-foreground/70 mt-0.5">Unusual volume from previously dormant IP range.</p>
              <button className="text-[10px] font-bold text-primary mt-1 hover:underline">Investigate →</button>
            </div>
            {/* Alert 3 */}
            <div className="p-3 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg">
              <div className="flex justify-between"><h4 className="text-xs font-bold text-yellow-400">Vehicle proximity</h4><span className="text-[9px] text-muted-foreground">10m ago</span></div>
              <p className="text-xs text-foreground/70 mt-0.5">Target idling near key infrastructure (45 mins).</p>
              <button className="text-[10px] font-bold text-primary mt-1 hover:underline">Geo-locate →</button>
            </div>
            {/* Alert 4 */}
            <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg">
              <div className="flex justify-between"><h4 className="text-xs font-bold text-blue-400">Pattern: Burr</h4><span className="text-[9px] text-muted-foreground">30m ago</span></div>
              <p className="text-xs text-foreground/70 mt-0.5">14 nodes matched, 30+ new relationships.</p>
              <button className="text-[10px] font-bold text-primary mt-1 hover:underline">Review →</button>
            </div>
          </div>
        </div>

        {/* --- ROW 2: LEFT (col-span-8) = RECORDS --- */}
        <div className="col-span-12 lg:col-span-8 bg-secondary/30 rounded-2xl border border-border/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            📄 Supporting Records (16 total)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card p-3 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground">CDR</span>
              <div className="text-lg font-mono font-bold">8</div>
              <span className="text-[9px] text-green-400">+2 new</span>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground">TXN</span>
              <div className="text-lg font-mono font-bold">4</div>
              <span className="text-[9px] text-yellow-400">⚠️ 1 flagged</span>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground">FIR / GEO</span>
              <div className="text-lg font-mono font-bold">4</div>
              <span className="text-[9px] text-blue-400">✅ 2 resolved</span>
            </div>
          </div>
        </div>

        {/* --- ROW 2: RIGHT (col-span-4) = QUICK ACTIONS --- */}
        <div className="col-span-12 lg:col-span-4 bg-card rounded-2xl border border-border/50 p-4 flex flex-col justify-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-xs font-bold text-primary transition-all">Upload Data</button>
            <button className="py-2 px-3 bg-secondary hover:bg-secondary/70 border border-border rounded-lg text-xs font-bold transition-all">Timeline</button>
            <button className="py-2 px-3 bg-secondary hover:bg-secondary/70 border border-border rounded-lg text-xs font-bold transition-all col-span-2">+ New Investigation</button>
          </div>
        </div>

      </div>
      
      {/* Optional Footer Metrics */}
      <div className="mt-6 pt-4 border-t border-border/30 flex gap-6 text-[10px] text-muted-foreground font-mono">
        <span>Edge Nodes: <strong className="text-foreground">42</strong></span>
        <span>Graph DB: <strong className="text-foreground">3 replicas</strong></span>
        <span>API Load: <strong className="text-foreground">1.4k req/s</strong></span>
      </div>
    </div>
  );
}
