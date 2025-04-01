import { useLocation } from "wouter";
import PseudoForm from "@/components/PseudoForm";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapPin } from "lucide-react";

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
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">Jeu du Chat</h1>
          </div>
          
          <div className="relative mb-6 p-4 bg-muted rounded-lg text-sm">
            <p className="text-center mb-2">
              Bienvenue au jeu du Chat et de la Souris !
            </p>
            <p className="text-center text-muted-foreground">
              Un jeu de poursuite géolocalisé à Saint-Foy-l'Argentière
            </p>
          </div>
          
          <PseudoForm 
            onSubmit={handleStartGame} 
            isLoading={createPlayerMutation.isPending} 
          />
        </CardContent>
      </Card>
      
      {/* Bouton de changement de thème */}
      <ThemeToggle />
      
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        <p>Version 1.0 &copy; 2025</p>
      </footer>
    </div>
  );
}
