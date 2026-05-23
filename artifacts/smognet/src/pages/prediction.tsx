import { useState } from "react";
import { Layout } from "@/components/layout";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { getAqiColor, getAqiLabel, getSeverityBadgeColor } from "@/lib/aqi";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { PredictionRequest, PredictionResult } from "@workspace/api-zod";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Multan", "Faisalabad", "Quetta", "Rawalpindi"];
const POLLUTANTS = ["PM2.5", "PM10", "AQI", "CO", "O3", "NOx"];

export default function Prediction() {
  const [city, setCity] = useState(CITIES[0]);
  const [targetHour, setTargetHour] = useState(12);
  const [daysAhead, setDaysAhead] = useState(1);
  const [pollutant, setPollutant] = useState("AQI");

  const predictionMutation = useMutation({
    mutationFn: async (body: PredictionRequest) => {
      const res = await fetch('/api/air-quality/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to predict");
      return res.json() as Promise<PredictionResult>;
    }
  });

  const handlePredict = () => {
    predictionMutation.mutate({ city, targetHour, daysAhead, pollutant });
  };

  const data = predictionMutation.data;
  const isLoading = predictionMutation.isPending;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="scan-line-container border-b border-primary/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-primary">AI_PREDICTION_ENGINE</h2>
            <div className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/50 animate-pulse">
              ACTIVE
            </div>
          </div>
          <p className="text-muted-foreground mt-1">Random Forest + XGBoost forecasting model</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-mono">FORECAST_PARAMETERS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-mono">TARGET_ZONE</label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="border-primary/30">
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(c => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted-foreground font-mono">TARGET_HOUR</label>
                    <span className="text-sm font-mono text-primary">{targetHour}:00</span>
                  </div>
                  <Slider 
                    value={[targetHour]} 
                    onValueChange={(val) => setTargetHour(val[0])} 
                    min={0} max={23} step={1} 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted-foreground font-mono">FORECAST_HORIZON (DAYS)</label>
                    <span className="text-sm font-mono text-primary">{daysAhead}</span>
                  </div>
                  <Slider 
                    value={[daysAhead]} 
                    onValueChange={(val) => setDaysAhead(val[0])} 
                    min={1} max={7} step={1} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-mono">TARGET_POLLUTANT</label>
                  <Select value={pollutant} onValueChange={setPollutant}>
                    <SelectTrigger className="border-primary/30">
                      <SelectValue placeholder="Select Pollutant" />
                    </SelectTrigger>
                    <SelectContent>
                      {POLLUTANTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full relative overflow-hidden" 
                  onClick={handlePredict}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
                      <span className="relative z-10">RUNNING_MODEL...</span>
                    </>
                  ) : (
                    "PREDICT LIVE POLLUTION"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-primary/20 rounded-lg bg-card/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,180,220,0.1)_50%,transparent_100%)] animate-[scanline_2s_linear_infinite]" />
                <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin mb-4" />
                <div className="font-mono text-primary animate-pulse tracking-widest">COMPUTING_VECTORS</div>
              </div>
            ) : data ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card primary-glow border-primary/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent -mr-8 -mt-8 rounded-full" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">PREDICTED_AQI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold data-pulse" style={{ color: getAqiColor(data.predictedAqi) }}>
                        {Math.round(data.predictedAqi)}
                      </div>
                      <div className={`mt-2 text-[10px] inline-block px-2 py-0.5 rounded border ${getSeverityBadgeColor(data.severity)}`}>
                        {data.severity.toUpperCase().replace(/ /g, "_")}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">PREDICTED_PM2.5</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{Math.round(data.predictedPm25)}</div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">PREDICTED_PM10</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{Math.round(data.predictedPm10)}</div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">CONFIDENCE_SCORE</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{Math.round(data.confidence * 100)}%</div>
                      <div className="mt-2 h-1 w-full bg-muted overflow-hidden rounded-full">
                        <div className="h-full bg-primary" style={{ width: `${data.confidence * 100}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">TREND_ANALYSIS</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                      {data.trend === 'rising' && <ArrowUp className="w-8 h-8 text-destructive" />}
                      {data.trend === 'stable' && <ArrowRight className="w-8 h-8 text-yellow-500" />}
                      {data.trend === 'falling' && <ArrowDown className="w-8 h-8 text-green-500" />}
                      <span className="text-lg font-mono capitalize">{data.trend}</span>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">HEALTH_DIRECTIVE</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-mono text-muted-foreground">{data.recommendation}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">24H_FORECAST_TRAJECTORY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.hourlyForecast}>
                          <defs>
                            <linearGradient id="colorAqiForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis 
                            dataKey="hour" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickFormatter={(val) => `${val}:00`}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                          />
                          <Area type="monotone" dataKey="aqi" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAqiForecast)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">FEATURE_IMPORTANCE_WEIGHTS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.factors} layout="vertical" margin={{ left: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis dataKey="factor" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                          />
                          <Bar dataKey="weight" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground font-mono text-sm">
                AWAITING_INPUT_PARAMETERS
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}