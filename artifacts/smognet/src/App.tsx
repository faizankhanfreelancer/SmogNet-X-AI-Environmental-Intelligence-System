import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import Anomalies from "@/pages/anomalies";
import Sources from "@/pages/sources";
import Alerts from "@/pages/alerts";
import Cities from "@/pages/cities";
import MapPage from "@/pages/map";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/anomalies" component={Anomalies} />
      <Route path="/sources" component={Sources} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/cities" component={Cities} />
      <Route path="/map" component={MapPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
