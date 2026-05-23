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
import { getAqiColor } from "@/lib/aqi";

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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">NATIONAL_COMMAND_CENTER</h2>
          <p className="text-muted-foreground mt-1">Real-time telemetry across 8 designated zones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">NAT_AVG_AQI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold" style={{ color: getAqiColor(stats.avgAqi) }}>
                {Math.round(stats.avgAqi)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">NAT_AVG_PM2.5</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{Math.round(stats.avgPm25)}<span className="text-lg text-muted-foreground ml-1">µg/m³</span></div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ACTIVE_ALERTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-destructive">{stats.totalAlerts}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CRITICAL_CITIES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-500">{stats.criticalCities}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Highest: <span className="text-foreground">{stats.mostPollutedCity}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card/50 border-primary/20">
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
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Area type="monotone" dataKey="pm25" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorPm25)" name="PM2.5" />
                    <Area type="monotone" dataKey="aqi" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorAqi)" name="AQI" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-mono">RECENT_ANOMALIES</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-0 h-[300px] overflow-y-auto">
                {spikes?.slice(0, 10).map((spike) => (
                  <div key={spike.id} className="flex flex-col p-4 border-b border-border/50 hover:bg-muted/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm">{spike.city}</span>
                      <span className="text-xs text-muted-foreground">{new Date(spike.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-muted-foreground">AQI: <span style={{ color: getAqiColor(spike.aqi) }}>{spike.aqi}</span></span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${spike.severity === 'CRITICAL' ? 'border-destructive text-destructive' : 'border-orange-500 text-orange-500'}`}>
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
