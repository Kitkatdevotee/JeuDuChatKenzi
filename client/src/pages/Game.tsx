import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import GameMap from "@/components/GameMap";
import PlayersList from "@/components/PlayersList";
import GameControls from "@/components/GameControls";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useGame from "@/hooks/useGame";
import { Coordinate, Player, GameSession } from "@shared/schema";

// Define the WebSocket URL relative to the current location
// For Replit, we use the same protocol and host
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/`;

console.log("WebSocket URL:", WS_URL);

export default function Game() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { 
    players, 
    gameRunning, 
    polygonCoordinates, 
    setPlayers, 
    setPolygonCoordinates, 
    setGameRunning,
    gameSession,
    setGameSession
  } = useGame();
  
  const playerId = localStorage.getItem("playerId");
  
  useEffect(() => {
    if (!playerId) {
      navigate("/");
      return;
    }
    
    // WebSocket functionality temporarily disabled for basic functionality testing
    console.log("WebSocket functionality disabled for testing basic app functionality");
    
    // We'll use React Query for data fetching instead
  }, [playerId, navigate]);
  
  // Fetch initial data
  const { isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['/api/players'],
  });
  
  const { isLoading: isLoadingSession } = useQuery({
    queryKey: ['/api/session'],
  });
  
  // Set state based on query results
  useEffect(() => {
    if (isLoadingPlayers) return;
    const playersData = queryClient.getQueryData(['/api/players']);
    if (playersData) {
      setPlayers(playersData as any[]);
    }
  }, [isLoadingPlayers, setPlayers]);
  
  useEffect(() => {
    if (isLoadingSession) return;
    const sessionData = queryClient.getQueryData(['/api/session']);
    if (sessionData) {
      setGameSession(sessionData as any);
      setGameRunning((sessionData as any).isRunning);
    }
  }, [isLoadingSession, setGameSession, setGameRunning]);
  
  // Draw zone mutation
  const drawZoneMutation = useMutation({
    mutationFn: async () => {
      // Default polygon
      const defaultPolygon: Coordinate[] = [
        { latitude: 45.745, longitude: 4.635 },
        { latitude: 45.748, longitude: 4.637 },
        { latitude: 45.745, longitude: 4.640 },
        { latitude: 45.742, longitude: 4.638 }
      ];
      
      const response = await apiRequest("POST", "/api/zones", {
        name: "Default Zone",
        coordinates: JSON.stringify(defaultPolygon)
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
      toast({
        title: "Zone dessinée",
        description: "La zone autorisée est visible pour tous les joueurs."
      });
    }
  });
  
  // Toggle game state mutation
  const toggleGameMutation = useMutation({
    mutationFn: async () => {
      if (!gameSession) return null;
      
      const response = await apiRequest("PATCH", `/api/session/${gameSession.id}`, {
        isRunning: !gameRunning
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setGameRunning(data.isRunning);
        queryClient.invalidateQueries({ queryKey: ['/api/session'] });
      }
    }
  });
  
  const handleDrawZone = () => {
    drawZoneMutation.mutate();
  };
  
  const handleToggleGame = () => {
    toggleGameMutation.mutate();
  };
  
  const isLoading = isLoadingPlayers || isLoadingSession;
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du jeu...</p>
        </div>
      </div>
    );
  }
  
  const playerName = localStorage.getItem("playerName") || "Joueur";
  const playerRole = localStorage.getItem("playerRole") || "Souris";

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header plus compact pour mobile */}
      <header className="bg-background border-b border-border p-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold flex items-center gap-1.5">
            <span className="text-primary">Jeu du Chat</span>
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Info du joueur actuel */}
            <div className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-md">
              <span>{playerRole === "Loup" ? "🐺" : "🐭"}</span>
              <span className="font-medium max-w-[100px] truncate">{playerName}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Map Container - Plein écran pour mobile */}
      <div className="flex-1 relative">
        <GameMap 
          players={players}
          polygonCoordinates={polygonCoordinates}
        />
        
        <PlayersList players={players} />
      </div>
      
      {/* Game Controls - Panel du bas adapté au mobile */}
      <GameControls 
        onDrawZone={handleDrawZone}
        onToggleGame={handleToggleGame}
        gameRunning={gameRunning}
        isDrawingZone={drawZoneMutation.isPending}
        isTogglingGame={toggleGameMutation.isPending}
      />
    </div>
  );
}
