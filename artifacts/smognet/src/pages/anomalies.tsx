import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetTimeline, 
  getGetTimelineQueryKey,
  useGetSpikes,
  getGetSpikesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getAqiColor } from "@/lib/aqi";

export default function Anomalies() {
  const { data: timeline, isLoading: tlLoading, error: tlError } = useGetTimeline(
    { days: 14 },
    { query: { queryKey: getGetTimelineQueryKey({ days: 14 }) } }
  );

  const { data: spikes, isLoading: spLoading, error: spError } = useGetSpikes(
    { limit: 50 },
    { query: { queryKey: getGetSpikesQueryKey({ limit: 50 }) } }
  );

  if (tlLoading || spLoading) return <Layout><LoadingState /></Layout>;
  if (tlError || spError) return <Layout><ErrorState /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-destructive">ANOMALY_DETECTION</h2>
          <p className="text-muted-foreground mt-1">Spike event history and algorithmic identification</p>
        </div>

        <Card className="bg-card/50 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg font-mono">14D_SPIKE_FREQUENCY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline}>
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
                  />
                  <Bar dataKey="spikeCount" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Spikes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-mono">ANOMALY_LOG</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-muted-foreground">TIMESTAMP</TableHead>
                  <TableHead className="font-mono text-muted-foreground">ZONE</TableHead>
                  <TableHead className="font-mono text-muted-foreground">SEVERITY</TableHead>
                  <TableHead className="font-mono text-muted-foreground">METHOD</TableHead>
                  <TableHead className="font-mono text-muted-foreground text-right">PM2.5</TableHead>
                  <TableHead className="font-mono text-muted-foreground text-right">AQI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spikes?.map((spike) => (
                  <TableRow key={spike.id} className="border-border/50 hover:bg-muted/20">
                    <TableCell className="font-mono text-xs">
                      {new Date(spike.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold">{spike.city}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        spike.severity === 'CRITICAL' ? 'border-destructive text-destructive' : 
                        spike.severity === 'HIGH' ? 'border-orange-500 text-orange-500' :
                        'border-yellow-500 text-yellow-500'
                      }`}>
                        {spike.severity}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{spike.method}</TableCell>
                    <TableCell className="text-right font-mono">{spike.pm25}</TableCell>
                    <TableCell className="text-right font-mono font-bold" style={{ color: getAqiColor(spike.aqi) }}>
                      {spike.aqi}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
