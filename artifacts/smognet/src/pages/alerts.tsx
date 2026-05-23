import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetAlerts, 
  getGetAlertsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSeverityBadgeColor } from "@/lib/aqi";

export default function Alerts() {
  const { data: alerts, isLoading, error } = useGetAlerts(
    {},
    { query: { queryKey: getGetAlertsQueryKey() } }
  );

  if (isLoading) return <Layout><LoadingState /></Layout>;
  if (error) return <Layout><ErrorState /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-orange-500">ALERT_CENTER</h2>
          <p className="text-muted-foreground mt-1">Active health advisories and public warnings</p>
        </div>

        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-mono">BROADCAST_LOG</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-muted-foreground">TIMESTAMP</TableHead>
                  <TableHead className="font-mono text-muted-foreground">ZONE</TableHead>
                  <TableHead className="font-mono text-muted-foreground">SEVERITY</TableHead>
                  <TableHead className="font-mono text-muted-foreground w-1/3">MESSAGE (EN)</TableHead>
                  <TableHead className="font-mono text-muted-foreground w-1/3 text-right">MESSAGE (UR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts?.map((alert) => (
                  <TableRow key={alert.id} className="border-border/50 hover:bg-muted/20">
                    <TableCell className="font-mono text-xs">
                      {new Date(alert.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold">{alert.city}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getSeverityBadgeColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{alert.messageEn}</TableCell>
                    <TableCell className="text-sm text-right font-sans" dir="rtl">{alert.messageUr}</TableCell>
                  </TableRow>
                ))}
                {(!alerts || alerts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      NO_ACTIVE_ALERTS
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
