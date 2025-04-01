import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import GameMap from "@/components/GameMap";
import PlayersList from "@/components/PlayersList";
import GameControls from "@/components/GameControls";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useGame from "@/hooks/useGame";
import { Coordinate, Player, GameSession } from "@shared/schema";
import { Crown } from "lucide-react";

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
  
  // État pour le mode dessin de zone
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  // État pour afficher/masquer les contrôles
  const [showControls, setShowControls] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  
  // Gestionnaire de défilement pour afficher/masquer les contrôles
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const st = scrollRef.current.scrollTop;
    if (st > lastScrollTop.current + 10) {
      // Défilement vers le bas - masquer les contrôles
      setShowControls(false);
    } else if (st < lastScrollTop.current - 10) {
      // Défilement vers le haut - afficher les contrôles
      setShowControls(true);
    }
    
    lastScrollTop.current = st <= 0 ? 0 : st;
  }, []);
  
  // Fetch initial data
  const { isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['/api/players'],
  });
  
  const { isLoading: isLoadingSession } = useQuery({
    queryKey: ['/api/session'],
  });
  
  // Récupération des zones
  const { isLoading: isLoadingZones } = useQuery({
    queryKey: ['/api/zones']
  });
  
  // Traitement des données de zone une fois récupérées
  useEffect(() => {
    if (isLoadingZones) return;
    const zonesData = queryClient.getQueryData(['/api/zones']) as any[];
    if (zonesData && zonesData.length > 0) {
      // Récupérer les coordonnées de la première zone
      const zoneCoordinates = JSON.parse(zonesData[0].coordinates);
      setPolygonCoordinates(zoneCoordinates);
    }
  }, [isLoadingZones, setPolygonCoordinates]);
  
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
  
  // Nouvelle mutation pour sauvegarder une zone dessinée
  const saveZoneMutation = useMutation({
    mutationFn: async (coordinates: Coordinate[]) => {
      const response = await apiRequest("POST", "/api/zones", {
        name: "Zone de jeu",
        coordinates: JSON.stringify(coordinates)
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
      setIsDrawingMode(false);
      toast({
        title: "Zone enregistrée",
        description: "La nouvelle zone de jeu est visible pour tous les joueurs."
      });
    }
  });
  
  // Fonction pour activer le mode dessin de zone
  const handleDrawZone = () => {
    setIsDrawingMode(true);
  };
  
  // Fonction pour sauvegarder la zone dessinée
  const handleZoneDrawn = (coordinates: Coordinate[]) => {
    saveZoneMutation.mutate(coordinates);
  };
  
  const handleToggleGame = () => {
    toggleGameMutation.mutate();
  };
  
  // Déconnexion du joueur
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!playerId) return null;
      
      const response = await apiRequest("PATCH", `/api/players/${playerId}/disconnect`, {});
      return response.json();
    },
    onSuccess: () => {
      // Nettoyer les données locales
      localStorage.removeItem("playerId");
      localStorage.removeItem("playerName");
      localStorage.removeItem("playerRole");
      
      // Rediriger vers la page d'accueil
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté du jeu"
      });
      
      navigate("/");
    }
  });
  
  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };
  
  // Fonction pour promouvoir un joueur en modérateur
  const handlePromoteToModerator = (playerId: number, username: string) => {
    toast({
      title: "Modérateur ajouté",
      description: `${username} a été promu comme modérateur du jeu.`,
    });
    
    // Dans une version complète, on sauvegarderait cette information en base de données
    // Pour l'instant, simulons la réussite de l'opération
  };
  
  const isLoading = isLoadingPlayers || isLoadingSession || isLoadingZones;
  
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
  
  // Vérification si le joueur est modérateur (Kitkatdevotee ou FRELONBALEINE27)
  const moderators = ["Kitkatdevotee", "FRELONBALEINE27"];
  const isModerator = moderators.includes(playerName);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header plus compact pour mobile */}
      <header className="bg-background border-b border-border p-3 shadow-sm z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold flex items-center gap-1.5">
            <span className="text-primary">Jeu du Chat</span>
          </h1>
          
          <div className="absolute left-1/2 transform -translate-x-1/2">
            {/* Info du joueur actuel - centré */}
            <div className="flex items-center gap-1 text-xs px-3 py-1.5 bg-muted/80 backdrop-blur-sm rounded-full shadow-sm">
              <span>{playerRole === "Loup" ? "🐺" : "🐭"}</span>
              <span className="font-medium max-w-[100px] truncate">{playerName}</span>
              {isModerator && (
                <span className="ml-1 text-amber-500">
                  <Crown className="h-3 w-3 inline-block" />
                </span>
              )}
            </div>
          </div>
          
          <div className="w-6">
            {/* Espace pour équilibrer */}
          </div>
        </div>
      </header>
      
      {/* Interface divisée avec carte en haut */}
      <div className="flex-1 flex flex-col relative">
        {/* Map Container - Seulement en haut */}
        <div className="h-3/5 relative">
          <GameMap 
            players={players}
            polygonCoordinates={polygonCoordinates}
            isDrawingMode={isDrawingMode}
            onZoneDrawn={handleZoneDrawn}
            isModerator={isModerator}
            onPromoteToModerator={handlePromoteToModerator}
          />
        </div>
        
        {/* Zone informative en dessous de la carte */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-2/5 bg-background border-t border-border p-4 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
          <h2 className="text-lg font-medium">Informations de jeu</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium mb-1">Statut</h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                gameRunning 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                <span className={`h-1.5 w-1.5 mr-1.5 rounded-full ${
                  gameRunning 
                    ? "bg-green-500 animate-pulse" 
                    : "bg-amber-500"
                }`}></span>
                {gameRunning ? "Partie en cours" : "En attente"}
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium mb-1">Joueurs</h3>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                  🐭 {players.filter(p => p.role === "Souris").length}
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full">
                  🐺 {players.filter(p => p.role === "Loup").length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Liste des joueurs intégrée */}
          <div className="flex-1 min-h-[200px] overflow-y-auto custom-scrollbar">
            <PlayersList 
              players={players} 
              onDisconnect={handleDisconnect}
              isModerator={isModerator}
              onPromoteToModerator={handlePromoteToModerator}
            />
          </div>
        </div>
      </div>
      
      {/* Game Controls - Panel du bas adapté au mobile avec animation */}
      <div className={`transition-all duration-300 ${
        showControls 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-full pointer-events-none"
      }`}>
        <GameControls 
          onDrawZone={handleDrawZone}
          onToggleGame={handleToggleGame}
          gameRunning={gameRunning}
          isDrawingZone={saveZoneMutation.isPending || isDrawingMode}
          isTogglingGame={toggleGameMutation.isPending}
          isModerator={isModerator}
        />
      </div>
    </div>
  );
}
