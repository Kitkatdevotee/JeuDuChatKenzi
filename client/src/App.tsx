import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import { ThemeToggle } from "@/components/ThemeToggle";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="font-sans">
      <Router />
      <ThemeToggle />
      <Toaster />
      
      {/* Crédit KitMars visible en bas de chaque page */}
      <div className="fixed bottom-4 left-0 w-full text-center z-50 pointer-events-none">
        <div className="kitmars-credit text-sm font-medium inline-block">
          KitMars studio
        </div>
      </div>
    </div>
  );
}

export default App;
