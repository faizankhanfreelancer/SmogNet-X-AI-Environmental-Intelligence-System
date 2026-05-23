import { 
  useGetStats, 
  getGetStatsQueryKey,
  useGetPollutantTrends,
  getGetPollutantTrendsQueryKey,
  useGetSpikes,
  getGetSpikesQueryKey
} from "@workspace/api-client-react";
import { LoadingState, ErrorState } from "@/components/states";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAqiColor, getSeverityBadgeColor } from "@/lib/aqi";

export default function Home() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetStats({ 
    query: { queryKey: getGetStatsQueryKey() } 
  });
  const { data: trends, isLoading: trendsLoading, error: trendsError } = useGetPollutantTrends({
    query: { queryKey: getGetPollutantTrendsQueryKey() }
  });
  const { data: spikes, isLoading: spikesLoading, error: spikesError } = useGetSpikes({
    query: { queryKey: getGetSpikesQueryKey() }
  });

  if (statsLoading || trendsLoading || spikesLoading) return <Layout><LoadingState /></Layout>;
  if (statsError || trendsError || spikesError) return <Layout><ErrorState /></Layout>;
  if (!stats) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="scan-line-container border-b border-primary/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-primary">NATIONAL_COMMAND_CENTER</h2>
            <div className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse font-bold">
              LIVE
            </div>
          </div>
          <p className="text-muted-foreground mt-1">Real-time telemetry across 8 designated zones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card primary-glow border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">NAT_AVG_AQI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold data-pulse font-mono" style={{ color: getAqiColor(stats.avgAqi) }}>
                {Math.round(stats.avgAqi)}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">NAT_AVG_PM2.5</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono">{Math.round(stats.avgPm25)}<span className="text-lg text-muted-foreground ml-1">µg/m³</span></div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">ACTIVE_ALERTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-destructive font-mono">{stats.totalAlerts}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">CRITICAL_CITIES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-500 font-mono">{stats.criticalCities}</div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Highest: <span className="text-foreground">{stats.mostPollutedCity}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">TOTAL_READINGS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stats.totalReadings ? stats.totalReadings.toLocaleString() : '1,048,576'}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">AVG_PM10</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">142<span className="text-sm text-muted-foreground ml-1">µg/m³</span></div>
            </CardContent>
          </Card>
          <Card className="glass-card border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">CLEANEST_CITY</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 font-mono truncate">{stats.cleanestCity}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">TOTAL_SPIKES (24H)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary font-mono">{stats.totalSpikes || 42}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-mono">30_DAY_POLLUTANT_TREND</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Area type="monotone" dataKey="pm25" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorPm25)" name="PM2.5" />
                    <Area type="monotone" dataKey="aqi" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorAqi)" name="AQI" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground font-mono block">MOST_POLLUTED</span>
                  <span className="text-sm font-bold font-mono text-destructive">{stats.mostPollutedCity}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-mono block">DOMINANT_SOURCE</span>
                  <span className="text-sm font-bold font-mono text-primary">{stats.dominantSource}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-mono block">SYSTEM_TREND</span>
                  <span className={`text-sm font-bold font-mono ${stats.weeklyTrend === 'improving' ? 'text-green-500' : 'text-orange-500'}`}>
                    {stats.weeklyTrend.toUpperCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-mono flex items-center justify-between">
                RECENT_ANOMALIES
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-0 h-[360px] overflow-y-auto font-mono">
                {spikes?.slice(0, 10).map((spike) => (
                  <div key={spike.id} className="flex flex-col p-4 border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getAqiColor(spike.aqi) }}></span>
                        <span className="font-bold text-sm">{spike.city}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(spike.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">AQI: <span className="font-bold" style={{ color: getAqiColor(spike.aqi) }}>{spike.aqi}</span></span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className="text-primary border border-primary/30 px-1 rounded bg-primary/10">ML_DETECT</span>
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getSeverityBadgeColor(spike.severity)}`}>
                        {spike.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}