import { useState } from "react";
import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetCityComparison, 
  getGetCityComparisonQueryKey,
  useGetCityStats,
  getGetCityStatsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { getAqiColor, getSeverityBadgeColor } from "@/lib/aqi";

const ALL_CITIES = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Multan", "Faisalabad", "Quetta", "Rawalpindi"];
const COLORS = [
  "#00b4dc", // cyan
  "#f97316", // orange
  "#a855f7", // purple
  "#eab308", // yellow
  "#22c55e", // green
  "#ef4444", // red
  "#3b82f6", // blue
  "#ec4899"  // pink
];

export default function Compare() {
  const [selectedCities, setSelectedCities] = useState<string[]>(ALL_CITIES);

  const { data: comparisonData, isLoading: compLoading, error: compError } = useGetCityComparison(
    { cities: selectedCities.join(",") },
    { query: { queryKey: getGetCityComparisonQueryKey({ cities: selectedCities.join(",") }), enabled: selectedCities.length > 0 } }
  );

  const { data: statsData, isLoading: statsLoading, error: statsError } = useGetCityStats(
    { query: { queryKey: getGetCityStatsQueryKey() } }
  );

  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const isLoading = compLoading || statsLoading;
  const isError = compError || statsError;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="scan-line-container border-b border-primary/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-primary">CITY_COMPARISON_MATRIX</h2>
            <div className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/50 animate-pulse">
              MULTI-ZONE
            </div>
          </div>
          <p className="text-muted-foreground mt-1">Cross-regional telemetry and pollutant overlap</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-mono">SELECT_ZONES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {ALL_CITIES.map((city, idx) => (
                <div key={city} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`city-${city}`} 
                    checked={selectedCities.includes(city)}
                    onCheckedChange={() => toggleCity(city)}
                    className="border-primary/50"
                  />
                  <Label 
                    htmlFor={`city-${city}`} 
                    className="text-sm font-mono cursor-pointer"
                    style={{ color: selectedCities.includes(city) ? COLORS[idx % COLORS.length] : 'inherit' }}
                  >
                    {city.toUpperCase()}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState />
        ) : (
          <div className="space-y-6">
            <Card className="glass-card primary-glow border-primary/40">
              <CardHeader>
                <CardTitle className="text-lg font-mono">MULTIVARIATE_RADAR_ANALYSIS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  {selectedCities.length > 0 && comparisonData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={comparisonData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'monospace' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
                        {selectedCities.map((city, idx) => (
                          <Radar
                            key={city}
                            name={city}
                            dataKey={city}
                            stroke={COLORS[idx % COLORS.length]}
                            fill={COLORS[idx % COLORS.length]}
                            fillOpacity={0.3}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground font-mono">
                      NO_ZONES_SELECTED
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsData?.filter(s => selectedCities.includes(s.city)).map((stat) => (
                <Card key={stat.city} className="glass-card">
                  <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="text-sm font-bold flex justify-between items-center">
                      <span>{stat.city.toUpperCase()}</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getAqiColor(stat.avgAqi) }}></span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-muted-foreground font-mono">AVG_AQI</span>
                      <span className="text-2xl font-bold font-mono" style={{ color: getAqiColor(stat.avgAqi) }}>
                        {Math.round(stat.avgAqi)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-muted-foreground font-mono">PM2.5</span>
                      <span className="text-lg font-mono">{Math.round(stat.avgPm25)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-muted-foreground font-mono">SPIKES</span>
                      <span className="text-lg font-mono">{stat.spikeCount}</span>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground font-mono block mb-1">DOMINANT_SOURCE</span>
                      <span className="text-sm font-mono text-primary truncate block">{stat.primarySource}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}