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

// Approximate normalized coordinates (x/y as % of SVG viewport)
const CITY_COORDS: Record<string, { x: number, y: number }> = {
  "Lahore": { x: 62, y: 38 },
  "Karachi": { x: 25, y: 68 },
  "Islamabad": { x: 55, y: 22 },
  "Peshawar": { x: 48, y: 18 },
  "Multan": { x: 55, y: 52 },
  "Faisalabad": { x: 58, y: 35 },
  "Quetta": { x: 30, y: 48 },
  "Rawalpindi": { x: 54, y: 24 }
};

export default function MapPage() {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const { data: stats, isLoading: cityLoading, error: cityError } = useGetCityStats(
    { query: { queryKey: getGetCityStatsQueryKey() } }
  );

  const { data: nationalStats, isLoading: natLoading, error: natError } = useGetStats(
    { query: { queryKey: getGetStatsQueryKey() } }
  );

  const isLoading = cityLoading || natLoading;
  const isError = cityError || natError;

  if (isLoading) return <Layout><LoadingState /></Layout>;
  if (isError) return <Layout><ErrorState /></Layout>;

  // Sort cities by AQI for the bar chart
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
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                        linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px'
                    }}
                  />
                  
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-md">
                    <path 
                      d="M 60,10 L 70,25 L 65,40 L 75,55 L 60,70 L 40,85 L 20,80 L 15,65 L 10,50 L 25,35 L 40,20 Z" 
                      fill="none" 
                      stroke="hsl(var(--border))" 
                      strokeWidth="0.5"
                      className="opacity-50"
                    />
                    
                    {stats?.map((cityStat) => {
                      const coords = CITY_COORDS[cityStat.city];
                      if (!coords) return null;
                      
                      const color = getAqiColor(cityStat.avgAqi);
                      const isHovered = hoveredCity === cityStat.city;
                      // Base radius on spike count (min 1.5, max 4)
                      const baseRadius = 1.5 + Math.min(cityStat.spikeCount * 0.2, 2.5);
                      
                      return (
                        <g 
                          key={cityStat.city} 
                          transform={`translate(${coords.x}, ${coords.y})`}
                          onMouseEnter={() => setHoveredCity(cityStat.city)}
                          onMouseLeave={() => setHoveredCity(null)}
                          className="cursor-crosshair cursor-pointer"
                        >
                          {cityStat.avgAqi > 200 && (
                            <>
                              <circle r={baseRadius * 2} fill={color} className="opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
                              <circle r={baseRadius * 2.5} fill={color} className="opacity-10 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                            </>
                          )}
                          <circle 
                            r={baseRadius} 
                            fill={color} 
                            stroke={isHovered ? "white" : "hsl(var(--background))"} 
                            strokeWidth="0.5" 
                            className="transition-all duration-300"
                          />
                          <text 
                            x={baseRadius + 1} 
                            y="0.5" 
                            fontSize="2.5" 
                            fill={isHovered ? "white" : "hsl(var(--foreground))"} 
                            fontFamily="monospace"
                            className="pointer-events-none drop-shadow-sm font-bold transition-all"
                          >
                            {cityStat.city.toUpperCase()}
                          </text>
                          <text 
                            x={baseRadius + 1} 
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
                  
                  {hoveredCity && stats && (
                    <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-md border border-border p-4 rounded shadow-lg z-10 w-48 font-mono">
                      {(() => {
                        const s = stats.find(s => s.city === hoveredCity);
                        if (!s) return null;
                        return (
                          <>
                            <h4 className="font-bold text-sm border-b border-border/50 pb-2 mb-2">{s.city.toUpperCase()}</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">AQI:</span>
                                <span style={{ color: getAqiColor(s.avgAqi) }}>{Math.round(s.avgAqi)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">PM2.5:</span>
                                <span>{Math.round(s.avgPm25)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">SPIKES:</span>
                                <span>{s.spikeCount}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <span className="text-muted-foreground block text-[10px]">SOURCE:</span>
                                <span className="text-primary">{s.primarySource}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: getAqiColor(25) }}></span>GOOD (0-50)</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: getAqiColor(75) }}></span>MODERATE (51-100)</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: getAqiColor(125) }}></span>SENSITIVE (101-150)</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: getAqiColor(175) }}></span>UNHEALTHY (151-200)</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: getAqiColor(250) }}></span>VERY UNHEALTHY (201-300)</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: getAqiColor(400) }}></span>HAZARDOUS (300+)</div>
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
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedStats}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis 
                        dataKey="city" 
                        type="category" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        tickFormatter={(val) => val.substring(0, 8)}
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