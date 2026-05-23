import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetCityStats, 
  getGetCityStatsQueryKey,
  useGetCityRankings,
  getGetCityRankingsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAqiColor } from "@/lib/aqi";

export default function Cities() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetCityStats(
    { query: { queryKey: getGetCityStatsQueryKey() } }
  );

  const { data: rankings, isLoading: rankLoading, error: rankError } = useGetCityRankings(
    { query: { queryKey: getGetCityRankingsQueryKey() } }
  );

  if (statsLoading || rankLoading) return <Layout><LoadingState /></Layout>;
  if (statsError || rankError) return <Layout><ErrorState /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CITY_INTELLIGENCE</h2>
          <p className="text-muted-foreground mt-1">Zone-specific metrics and comparative rankings</p>
        </div>

        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-mono">ZONE_METRICS</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-muted-foreground">RANK</TableHead>
                  <TableHead className="font-mono text-muted-foreground">ZONE</TableHead>
                  <TableHead className="font-mono text-muted-foreground">PROVINCE</TableHead>
                  <TableHead className="font-mono text-muted-foreground text-right">AQI</TableHead>
                  <TableHead className="font-mono text-muted-foreground text-right">PM2.5</TableHead>
                  <TableHead className="font-mono text-muted-foreground text-right">SPIKES</TableHead>
                  <TableHead className="font-mono text-muted-foreground text-right">ALERTS</TableHead>
                  <TableHead className="font-mono text-muted-foreground text-right">PRIMARY_VECTOR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings?.map((rank) => {
                  const stat = stats?.find(s => s.city === rank.city);
                  return (
                    <TableRow key={rank.city} className="border-border/50 hover:bg-muted/20">
                      <TableCell className="font-mono text-xs">{rank.rank}</TableCell>
                      <TableCell className="font-bold">{rank.city}</TableCell>
                      <TableCell className="text-muted-foreground">{rank.province}</TableCell>
                      <TableCell className="text-right font-mono font-bold" style={{ color: getAqiColor(stat?.avgAqi || rank.avgAqi) }}>
                        {Math.round(stat?.avgAqi || rank.avgAqi)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{Math.round(stat?.avgPm25 || rank.avgPm25)}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{stat?.spikeCount || rank.spikeCount}</TableCell>
                      <TableCell className="text-right font-mono text-orange-500">{stat?.alertCount || 0}</TableCell>
                      <TableCell className="text-right text-xs">{stat?.primarySource || rank.primarySource}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
