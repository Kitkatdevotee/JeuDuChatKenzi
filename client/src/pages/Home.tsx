import { useLocation } from "wouter";
import PseudoForm from "@/components/PseudoForm";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapPin, Cat, Mouse } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const createPlayerMutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      // Centre sur Saint-Foy-l'Argentière, France
      const initialPosition = {
        latitude: "45.7456",
        longitude: "4.635"
      };
      
      const response = await apiRequest("POST", "/api/players", {
        username: data.username,
        role: "Souris", // Rôle par défaut
        ...initialPosition,
        isActive: true
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("playerId", data.id);
      localStorage.setItem("playerName", data.username);
      localStorage.setItem("playerRole", data.role);
      navigate("/game");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le joueur",
        variant: "destructive"
      });
    }
  });
  
  const handleStartGame = (username: string) => {
    createPlayerMutation.mutate({ username });
  };
  
  return (
    <div className="flex-1 flex flex-col items-center justify-between min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-md pt-8">
        {/* Logo et titre animés */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-2">
            <div className="flex items-center space-x-1 bg-background/50 backdrop-blur-sm p-2 rounded-full">
              <Cat className="w-7 h-7 text-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter text-primary">Jeu du Chat</h1>
              <Mouse className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm text-center px-2">
            Poursuite géolocalisée à Saint-Foy-l'Argentière
          </p>
        </div>
        
        <Card className="w-full shadow-lg border-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 to-muted p-4 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h2 className="text-xl font-semibold">Connexion au jeu</h2>
            <p className="text-sm text-muted-foreground mb-0">
              Bienvenue au jeu du Chat et de la Souris !
            </p>
          </div>
          
          <CardContent className="pt-6">
            <PseudoForm 
              onSubmit={handleStartGame} 
              isLoading={createPlayerMutation.isPending} 
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Bouton de changement de thème */}
      <ThemeToggle />
      
      <footer className="mt-6 text-center text-xs flex flex-col items-center space-y-1 pb-4">
        <div className="kitmars-credit font-bold tracking-wider pulse-red">
          KitMars studio
        </div>
        <p className="text-muted-foreground">Version 1.0 &copy; 2025</p>
      </footer>
    </div>
  );
}
