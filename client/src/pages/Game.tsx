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
// Use the same host but ensure it's pointing to the correct path
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

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
    
    // Initialize WebSocket connection
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log("WebSocket Connected");
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'INIT':
          setPlayers(data.data.players);
          setGameSession(data.data.gameSession);
          if (data.data.gameZones.length > 0) {
            // We just use the first zone for simplicity
            const zoneCoords = JSON.parse(data.data.gameZones[0].coordinates);
            setPolygonCoordinates(zoneCoords);
          }
          break;
        case 'PLAYER_JOINED':
          setPlayers(prev => [...prev, data.data]);
          break;
        case 'PLAYER_MOVED':
          setPlayers(prev => 
            prev.map(p => p.id === data.data.id ? data.data : p)
          );
          break;
        case 'ZONE_CREATED':
          const coordinates = JSON.parse(data.data.coordinates);
          setPolygonCoordinates(coordinates);
          break;
        case 'GAME_STATE_CHANGED':
          setGameSession(data.data);
          setGameRunning(data.data.isRunning);
          break;
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au serveur.",
        variant: "destructive"
      });
    };
    
    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };
    
    // Clean up WebSocket on component unmount
    return () => {
      ws.close();
    };
  }, [playerId, navigate, toast, setPlayers, setPolygonCoordinates, setGameRunning, setGameSession]);
  
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
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Jeu du Chat</h1>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              gameRunning 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              <span className={`h-2 w-2 mr-1 rounded-full ${
                gameRunning 
                  ? "bg-green-500 animate-pulse" 
                  : "bg-gray-400"
              }`}></span>
              {gameRunning ? "En cours" : "En attente"}
            </span>
          </div>
        </div>
      </header>
      
      {/* Map Container */}
      <div className="flex-1 relative">
        <GameMap 
          players={players}
          polygonCoordinates={polygonCoordinates}
        />
        
        <PlayersList players={players} />
      </div>
      
      {/* Game Controls */}
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
