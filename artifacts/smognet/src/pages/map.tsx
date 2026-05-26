import { useState } from "react";
import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetCityStats, 
  getGetCityStatsQueryKey,
  useGetStats,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getAqiColor } from "@/lib/aqi";

const CITY_COORDS: Record<string, { x: number, y: number }> = {
  "Lahore":      { x: 62, y: 38 },
  "Karachi":     { x: 25, y: 68 },
  "Islamabad":   { x: 55, y: 22 },
  "Peshawar":    { x: 48, y: 18 },
  "Multan":      { x: 55, y: 52 },
  "Faisalabad":  { x: 58, y: 35 },
  "Quetta":      { x: 30, y: 48 },
  "Rawalpindi":  { x: 54, y: 24 }
};

// Simplified but geographically recognisable Pakistan outline in the same SVG coordinate space
const PAKISTAN_PATH = `
  M 48,6
  L 56,8
  L 64,12
  L 70,18
  L 73,28
  L 72,38
  L 70,50
  L 66,62
  L 58,74
  L 48,80
  L 36,80
  L 24,76
  L 17,66
  L 16,54
  L 18,42
  L 20,30
  L 26,20
  L 34,12
  Z
`;

export default function MapPage() {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const { data: stats, isLoading: cityLoading, error: cityError } = useGetCityStats(
    { query: { queryKey: getGetCityStatsQueryKey(), refetchInterval: 30000 } }
  );

  const { data: nationalStats, isLoading: natLoading, error: natError } = useGetStats(
    { query: { queryKey: getGetStatsQueryKey(), refetchInterval: 30000 } }
  );

  const isLoading = cityLoading || natLoading;
  const isError = cityError || natError;

  if (isLoading) return <Layout><LoadingState /></Layout>;
  if (isError) return <Layout><ErrorState /></Layout>;

  const sortedStats = stats ? [...stats].sort((a, b) => b.avgAqi - a.avgAqi) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="scan-line-container border-b border-primary/20 pb-4 mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary">GEOSPATIAL_OVERVIEW</h2>
          <p className="text-muted-foreground mt-1">Live national monitoring grid</p>
        </div>

        {nationalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground">NAT_AVG_AQI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono" style={{ color: getAqiColor(nationalStats.avgAqi) }}>
                  {Math.round(nationalStats.avgAqi)}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground">MOST_POLLUTED</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold font-mono text-destructive truncate">
                  {nationalStats.mostPollutedCity}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground">CLEANEST_ZONE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold font-mono text-green-500 truncate">
                  {nationalStats.cleanestCity}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground">DOMINANT_SOURCE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold font-mono truncate">
                  {nationalStats.dominantSource}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="text-lg font-mono">SEVERITY_MAP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] bg-muted/10 rounded-lg overflow-hidden border border-border">
                  {/* Grid overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                        linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px'
                    }}
                  />

                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                    {/* Pakistan country outline */}
                    <path
                      d={PAKISTAN_PATH}
                      fill="hsl(var(--primary)/0.06)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="0.6"
                      strokeLinejoin="round"
                    />

                    {/* Decorative scan line */}
                    <line
                      x1="16" y1="50" x2="73" y2="50"
                      stroke="hsl(var(--primary))"
                      strokeWidth="0.15"
                      strokeDasharray="1 2"
                      opacity="0.3"
                    />
                    <line
                      x1="45" y1="6" x2="45" y2="82"
                      stroke="hsl(var(--primary))"
                      strokeWidth="0.15"
                      strokeDasharray="1 2"
                      opacity="0.3"
                    />

                    {stats?.map((cityStat) => {
                      const coords = CITY_COORDS[cityStat.city];
                      if (!coords) return null;

                      const color = getAqiColor(cityStat.avgAqi);
                      const isHovered = hoveredCity === cityStat.city;
                      const baseRadius = 1.8 + Math.min(cityStat.spikeCount * 0.18, 2.2);

                      return (
                        <g
                          key={cityStat.city}
                          transform={`translate(${coords.x}, ${coords.y})`}
                          onMouseEnter={() => setHoveredCity(cityStat.city)}
                          onMouseLeave={() => setHoveredCity(null)}
                          className="cursor-pointer"
                        >
                          {/* Pulse rings for high AQI */}
                          {cityStat.avgAqi > 180 && (
                            <>
                              <circle r={baseRadius * 2.0} fill={color} className="opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
                              <circle r={baseRadius * 2.8} fill={color} className="opacity-08 animate-ping" style={{ animationDuration: '3.2s', animationDelay: '0.6s' }} />
                            </>
                          )}

                          {/* City dot */}
                          <circle
                            r={baseRadius}
                            fill={color}
                            stroke={isHovered ? "white" : "hsl(var(--background))"}
                            strokeWidth="0.6"
                            className="transition-all duration-200"
                            style={{ filter: isHovered ? `drop-shadow(0 0 3px ${color})` : undefined }}
                          />

                          {/* Crosshair lines */}
                          {isHovered && (
                            <>
                              <line x1={-baseRadius - 1} y1="0" x2={baseRadius + 1} y2="0" stroke="white" strokeWidth="0.3" opacity="0.5" />
                              <line x1="0" y1={-baseRadius - 1} x2="0" y2={baseRadius + 1} stroke="white" strokeWidth="0.3" opacity="0.5" />
                            </>
                          )}

                          {/* City name + AQI */}
                          <text
                            x={baseRadius + 1.2}
                            y="0.5"
                            fontSize="2.5"
                            fill={isHovered ? "white" : "hsl(var(--foreground))"}
                            fontFamily="monospace"
                            fontWeight="bold"
                            className="pointer-events-none drop-shadow-sm"
                          >
                            {cityStat.city.toUpperCase()}
                          </text>
                          <text
                            x={baseRadius + 1.2}
                            y="3.5"
                            fontSize="2"
                            fill={color}
                            fontFamily="monospace"
                            className="pointer-events-none"
                          >
                            {Math.round(cityStat.avgAqi)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Hover tooltip */}
                  {hoveredCity && stats && (
                    <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-md border border-primary/30 p-4 rounded shadow-xl z-10 w-52 font-mono">
                      {(() => {
                        const s = stats.find(s => s.city === hoveredCity);
                        if (!s) return null;
                        const aqiColor = getAqiColor(s.avgAqi);
                        return (
                          <>
                            <h4 className="font-bold text-sm border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: aqiColor }} />
                              {s.city.toUpperCase()}
                            </h4>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">AQI</span>
                                <span className="font-bold" style={{ color: aqiColor }}>{Math.round(s.avgAqi)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">PM2.5</span>
                                <span>{Math.round(s.avgPm25)} µg/m³</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">SPIKES</span>
                                <span className="text-destructive">{s.spikeCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ALERTS</span>
                                <span className="text-orange-500">{s.alertCount}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-border/50 flex justify-between">
                                <span className="text-muted-foreground">SOURCE</span>
                                <span className="text-primary">{s.primarySource}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-5 flex flex-wrap justify-center gap-3 text-[10px] font-mono">
                  {[
                    { label: "GOOD", aqi: 25 },
                    { label: "MODERATE", aqi: 75 },
                    { label: "SENSITIVE", aqi: 125 },
                    { label: "UNHEALTHY", aqi: 175 },
                    { label: "VERY UNHEALTHY", aqi: 250 },
                    { label: "HAZARDOUS", aqi: 400 },
                  ].map(({ label, aqi }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getAqiColor(aqi) }} />
                      {label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="text-lg font-mono">AQI_RANKING</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedStats}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 42, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis
                        dataKey="city"
                        type="category"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickFormatter={(val) => val.substring(0, 9)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                      />
                      <Bar dataKey="avgAqi" name="Avg AQI" radius={[0, 4, 4, 0]}>
                        {sortedStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getAqiColor(entry.avgAqi)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
