import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetCityStats, 
  getGetCityStatsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { data: stats, isLoading, error } = useGetCityStats(
    { query: { queryKey: getGetCityStatsQueryKey() } }
  );

  if (isLoading) return <Layout><LoadingState /></Layout>;
  if (error) return <Layout><ErrorState /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">GEOSPATIAL_OVERVIEW</h2>
          <p className="text-muted-foreground mt-1">Live national monitoring grid</p>
        </div>

        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-mono">SEVERITY_MAP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full max-w-3xl mx-auto aspect-[3/4] bg-muted/10 rounded-lg overflow-hidden border border-border">
              {/* Grid background for "mission control" vibe */}
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
                {/* Simplified approximate bounding box / abstract representation of Pakistan outline */}
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
                  
                  return (
                    <g key={cityStat.city} transform={`translate(${coords.x}, ${coords.y})`}>
                      {/* Pulse effect for hazardous/critical */}
                      {cityStat.avgAqi > 200 && (
                        <>
                          <circle r="3" fill={color} className="opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
                          <circle r="4" fill={color} className="opacity-10 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                        </>
                      )}
                      <circle r="1.5" fill={color} stroke="hsl(var(--background))" strokeWidth="0.5" />
                      <text 
                        x="2.5" 
                        y="0.5" 
                        fontSize="2.5" 
                        fill="hsl(var(--foreground))" 
                        fontFamily="monospace"
                        className="pointer-events-none drop-shadow-sm font-bold"
                      >
                        {cityStat.city.toUpperCase()}
                      </text>
                      <text 
                        x="2.5" 
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
    </Layout>
  );
}
