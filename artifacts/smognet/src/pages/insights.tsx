import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetAiInsights, 
  getGetAiInsightsQueryKey,
  useGetHourlyPatterns,
  getGetHourlyPatternsQueryKey,
  useGetStats,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { 
  AlertTriangle, 
  Clock, 
  Factory, 
  TrendingUp, 
  TrendingDown, 
  AlertOctagon, 
  Leaf, 
  Calendar, 
  Shield,
  Activity
} from "lucide-react";
import { getSeverityBadgeColor } from "@/lib/aqi";

const ICON_MAP: Record<string, React.ElementType> = {
  alert: AlertTriangle,
  clock: Clock,
  factory: Factory,
  trending: TrendingUp,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  warning: AlertOctagon,
  leaf: Leaf,
  calendar: Calendar,
  shield: Shield,
  activity: Activity
};

export default function Insights() {
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useGetAiInsights(
    { query: { queryKey: getGetAiInsightsQueryKey() } }
  );

  const { data: hourlyData, isLoading: hourlyLoading, error: hourlyError } = useGetHourlyPatterns(
    {},
    { query: { queryKey: getGetHourlyPatternsQueryKey({}) } }
  );

  const { data: stats, isLoading: statsLoading, error: statsError } = useGetStats(
    { query: { queryKey: getGetStatsQueryKey() } }
  );

  const isLoading = insightsLoading || hourlyLoading || statsLoading;
  const isError = insightsError || hourlyError || statsError;

  if (isLoading) return <Layout><LoadingState /></Layout>;
  if (isError) return <Layout><ErrorState /></Layout>;
  if (!insights || !hourlyData || !stats) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="scan-line-container border-b border-primary/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-primary">AI_INSIGHTS_ENGINE</h2>
            <div className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/50 animate-pulse">
              ML_ACTIVE
            </div>
          </div>
          <p className="text-muted-foreground mt-1">Machine learning pattern recognition — 8 zones monitored</p>
        </div>

        {/* Large KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6 pb-4 px-4 text-center">
              <span className="text-[10px] text-muted-foreground block mb-2 font-mono">MOST_POLLUTED</span>
              <span className="text-sm font-bold font-mono text-destructive truncate block">{stats.mostPollutedCity}</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 pb-4 px-4 text-center">
              <span className="text-[10px] text-muted-foreground block mb-2 font-mono">CLEANEST_ZONE</span>
              <span className="text-sm font-bold font-mono text-green-500 truncate block">{stats.cleanestCity}</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 pb-4 px-4 text-center">
              <span className="text-[10px] text-muted-foreground block mb-2 font-mono">PEAK_HOUR</span>
              <span className="text-sm font-bold font-mono text-primary truncate block">{stats.peakHour}:00</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 pb-4 px-4 text-center">
              <span className="text-[10px] text-muted-foreground block mb-2 font-mono">DOMINANT_SOURCE</span>
              <span className="text-sm font-bold font-mono truncate block">{stats.dominantSource}</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 pb-4 px-4 text-center">
              <span className="text-[10px] text-muted-foreground block mb-2 font-mono">WEEKLY_TREND</span>
              <span className={`text-sm font-bold font-mono truncate block ${stats.weeklyTrend === 'improving' ? 'text-green-500' : 'text-destructive'}`}>
                {stats.weeklyTrend.toUpperCase()}
              </span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 pb-4 px-4 text-center">
              <span className="text-[10px] text-muted-foreground block mb-2 font-mono">RISK_LEVEL</span>
              <span className="text-sm font-bold font-mono text-orange-500 truncate block">ELEVATED</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card lg:col-span-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-mono">HOURLY_POLLUTION_PATTERN</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="hour" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(val) => `${val}:00`}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                      cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    />
                    <Bar dataKey="aqi" radius={[4, 4, 0, 0]}>
                      {hourlyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isPeak ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {insights.insights.map((insight, idx) => {
              const Icon = ICON_MAP[insight.icon] || Activity;
              const borderClass = insight.severity === 'critical' ? 'border-destructive' 
                : insight.severity === 'high' ? 'border-orange-500'
                : insight.severity === 'medium' ? 'border-yellow-500'
                : 'border-green-500';
                
              return (
                <Card key={idx} className={`glass-card border-l-4 ${borderClass}`}>
                  <CardContent className="p-4 flex gap-4">
                    <div className={`p-3 rounded-full bg-muted/30 flex-shrink-0 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${
                        insight.severity === 'critical' ? 'text-destructive' :
                        insight.severity === 'high' ? 'text-orange-500' :
                        insight.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm font-mono mb-1">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{insight.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}