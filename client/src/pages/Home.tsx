import { useState } from "react";
import { useLocation } from "wouter";
import PseudoForm from "@/components/PseudoForm";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const createPlayerMutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      const initialPosition = {
        latitude: "45.7456",
        longitude: "4.635"
      };
      
      const response = await apiRequest("POST", "/api/players", {
        username: data.username,
        role: "Souris", // Default role
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
    <div className="flex-1 flex items-center justify-center px-4 py-6 min-h-screen bg-gray-100">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">Jeu du Chat</h1>
          <p className="text-gray-600 mb-6 text-center">
            Bienvenue au jeu du Chat et de la Souris ! Entrez votre pseudo pour commencer.
          </p>
          
          <PseudoForm 
            onSubmit={handleStartGame} 
            isLoading={createPlayerMutation.isPending} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
