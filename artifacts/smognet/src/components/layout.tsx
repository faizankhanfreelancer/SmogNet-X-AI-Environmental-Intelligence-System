import { Link, useLocation } from "wouter";
import { 
  Activity, 
  AlertTriangle, 
  BarChart2, 
  Factory, 
  Map as MapIcon, 
  Radar, 
  Building2,
  Cpu,
  BarChart3,
  Brain
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Command Center", icon: Radar },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/anomalies", label: "Anomalies", icon: Activity },
    { href: "/sources", label: "Sources", icon: Factory },
    { href: "/alerts", label: "Alerts", icon: AlertTriangle },
    { href: "/cities", label: "Cities", icon: Building2 },
    { href: "/map", label: "Map", icon: MapIcon },
    { href: "/prediction", label: "Live Prediction", icon: Cpu },
    { href: "/compare", label: "Compare", icon: BarChart3 },
    { href: "/insights", label: "AI Insights", icon: Brain },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-mono dark">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tighter text-primary">SMOGNET_OS</h1>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            SYS_ONLINE
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 tracking-widest">
            8 ZONES MONITORED
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${
                  location === item.href 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm tracking-wide">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          v2.0.0-AI
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
