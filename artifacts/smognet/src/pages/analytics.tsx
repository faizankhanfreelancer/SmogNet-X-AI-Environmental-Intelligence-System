import { useState } from "react";
import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetPollutantTrends, 
  getGetPollutantTrendsQueryKey,
  useGetSourceDistribution,
  getGetSourceDistributionQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Multan", "Faisalabad", "Quetta", "Rawalpindi"];
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  const { data: trends, isLoading: trendsLoading, error: trendsError } = useGetPollutantTrends(
    { city: selectedCity, days: 30 },
    { query: { queryKey: getGetPollutantTrendsQueryKey({ city: selectedCity, days: 30 }) } }
  );

  const { data: sources, isLoading: sourcesLoading, error: sourcesError } = useGetSourceDistribution(
    { city: selectedCity },
    { query: { queryKey: getGetSourceDistributionQueryKey({ city: selectedCity }) } }
  );

  if (trendsLoading || sourcesLoading) return <Layout><LoadingState /></Layout>;
  if (trendsError || sourcesError) return <Layout><ErrorState /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">DATA_ANALYTICS</h2>
            <p className="text-muted-foreground mt-1">Detailed telemetry and source apportionment</p>
          </div>
          
          <Select value={selectedCity || "all"} onValueChange={(val) => setSelectedCity(val === "all" ? undefined : val)}>
            <SelectTrigger className="w-[200px] border-primary/30">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL_ZONES</SelectItem>
              {CITIES.map(city => (
                <SelectItem key={city} value={city}>{city.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/50 border-primary/20 col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-mono">POLLUTANT_CONCENTRATION (30D)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
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
                    <Legend />
                    <Line type="monotone" dataKey="pm25" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="PM2.5" />
                    <Line type="monotone" dataKey="pm10" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="PM10" />
                    <Line type="monotone" dataKey="aqi" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="AQI" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-mono">SOURCE_APPORTIONMENT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {sources && sources.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sources}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="percentage"
                        nameKey="source"
                      >
                        {sources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">NO_DATA_AVAILABLE</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
