import { useState } from "react";
import { Layout } from "@/components/layout";
import { LoadingState, ErrorState } from "@/components/states";
import { 
  useGetClassifications, 
  getGetClassificationsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Multan", "Faisalabad", "Quetta", "Rawalpindi"];

export default function Sources() {
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  const { data: classifications, isLoading, error } = useGetClassifications(
    { city: selectedCity },
    { query: { queryKey: getGetClassificationsQueryKey({ city: selectedCity }) } }
  );

  if (isLoading) return <Layout><LoadingState /></Layout>;
  if (error) return <Layout><ErrorState /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">SOURCE_CLASSIFICATION</h2>
            <p className="text-muted-foreground mt-1">Pollution vector identification algorithms</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classifications?.map((c) => (
            <Card key={`${c.city}-${c.source}`} className="bg-card/50 border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-mono text-primary">{c.source}</CardTitle>
                  <span className="text-xs text-muted-foreground font-mono">{c.city || 'NATIONAL'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold">{c.percentage.toFixed(1)}%</span>
                  <span className="text-sm text-muted-foreground">n={c.count}</span>
                </div>
                <Progress value={c.percentage} className="h-2" />
              </CardContent>
            </Card>
          ))}
          {(!classifications || classifications.length === 0) && (
            <div className="col-span-2 text-center p-8 text-muted-foreground border border-dashed border-border rounded-lg">
              NO_VECTORS_IDENTIFIED
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
