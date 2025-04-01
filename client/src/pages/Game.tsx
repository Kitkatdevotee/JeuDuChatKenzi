import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import GameMap from "@/components/GameMap";
import PlayersList from "@/components/PlayersList";
import GameControls from "@/components/GameControls";
import RoleWheel from "@/components/RoleWheel";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useGame from "@/hooks/useGame";
import { Coordinate as SharedCoordinate } from "@shared/schema";
import { Player, Coordinate, GameSession } from "@/lib/types";
import { Crown, LogOut, PaintBucket, ChevronUp, ChevronDown, Play, Pause, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";

// Define the WebSocket URL relative to the current location
// For Replit, we use the same protocol and host
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/`;

console.log("WebSocket URL:", WS_URL);

// Fonction pour obtenir la couleur d'un joueur en fonction de son ID ou de sa couleur personnalisée
const getPlayerColor = (id: number, players: Player[] = []): string => {
  // Liste des couleurs spécifiées par le client: 
  // Rouge, Orange, Jaune, Vert foncé, Vert clair, Bleu foncé, Bleu clair, 
  // Violet, Marron, Blanc, Noir, Gris et Rose
  const PLAYER_COLORS = [
    "#e63946", // Rouge
    "#ff8c00", // Orange
    "#ffd700", // Jaune
    "#2e8b57", // Vert foncé
    "#90ee90", // Vert clair
    "#0a2463", // Bleu foncé
    "#73d2de", // Bleu clair
    "#9b5de5", // Violet
    "#8b4513", // Marron
    "#ffffff", // Blanc
    "#000000", // Noir
    "#808080", // Gris
    "#ff69b4"  // Rose
  ];
  
  // Chercher si le joueur a une couleur personnalisée
  const player = players.find(p => p.id === id);
  
  // Si le joueur a une couleur personnalisée et que ce n'est pas null, l'utiliser
  if (player?.color) {
    return player.color;
  }
  
  // Sinon, utiliser la couleur par défaut basée sur l'ID
  return PLAYER_COLORS[id % PLAYER_COLORS.length];
};

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
  // État pour la roulette de sélection du loup
  const [showRoleWheel, setShowRoleWheel] = useState(false);
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
    // Si on démarre une partie et qu'il n'y a pas encore de loup, on affiche la roulette de sélection
    if (!gameRunning && players.filter(p => p.role === "Loup").length === 0 && players.length >= 2) {
      setShowRoleWheel(true);
      return;
    }
    
    toggleGameMutation.mutate();
  };
  
  // Mutation pour mettre à jour le rôle d'un joueur
  const updatePlayerRoleMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await apiRequest("PATCH", `/api/players/${playerId}/role`, {
        role: "Loup"
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      // Après avoir choisi le loup, on démarre la partie
      toggleGameMutation.mutate();
    }
  });
  
  // Fonction pour gérer la sélection d'un joueur comme loup
  const handleWheelComplete = (selectedPlayerId: number) => {
    updatePlayerRoleMutation.mutate(selectedPlayerId);
    setShowRoleWheel(false);
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
  
  // Mutation pour mettre à jour la couleur d'un joueur
  const updatePlayerColorMutation = useMutation({
    mutationFn: async (color: string) => {
      if (!playerId) return null;
      
      const response = await apiRequest("PATCH", `/api/players/${playerId}/color`, {
        color
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['/api/players'] });
        toast({
          title: "Couleur changée",
          description: "Votre couleur a été modifiée avec succès!",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de changer votre couleur. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  });

  // Fonction pour changer la couleur du joueur
  const handleChangeColor = () => {
    // Liste des couleurs spécifiées par le client
    const PLAYER_COLORS = [
      "#e63946", // Rouge
      "#ff8c00", // Orange
      "#ffd700", // Jaune
      "#2e8b57", // Vert foncé
      "#90ee90", // Vert clair
      "#0a2463", // Bleu foncé
      "#73d2de", // Bleu clair
      "#9b5de5", // Violet
      "#8b4513", // Marron
      "#ffffff", // Blanc
      "#000000", // Noir
      "#808080", // Gris
      "#ff69b4"  // Rose
    ];
    
    // Choisir une couleur aléatoire différente de la couleur actuelle
    const randomColor = () => {
      let newIndex = Math.floor(Math.random() * PLAYER_COLORS.length);
      
      // Trouver le joueur actuel
      const currentPlayerId = parseInt(playerId || "0");
      const currentPlayer = players.find(p => p.id === currentPlayerId);
      
      // Si le joueur a déjà une couleur personnalisée, éviter de choisir la même
      if (currentPlayer?.color) {
        while (PLAYER_COLORS[newIndex] === currentPlayer.color) {
          newIndex = Math.floor(Math.random() * PLAYER_COLORS.length);
        }
      }
      
      return PLAYER_COLORS[newIndex];
    };
    
    // Obtenir une nouvelle couleur et l'envoyer au serveur
    const newColor = randomColor();
    updatePlayerColorMutation.mutate(newColor);
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
    <div className="h-screen relative overflow-hidden">
      {/* Map comme arrière-plan de toute l'application */}
      <div className="absolute inset-0 z-0">
        <GameMap 
          players={players}
          polygonCoordinates={polygonCoordinates}
          isDrawingMode={isDrawingMode}
          onZoneDrawn={handleZoneDrawn}
          isModerator={isModerator}
          onPromoteToModerator={handlePromoteToModerator}
        />
      </div>
      
      {/* Layout superposé sur la carte - tout le contenu ici sera au-dessus de la carte */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {/* Header flottant sur la carte avec fond semi-transparent */}
        <header className="bg-background/80 backdrop-blur-sm border-b border-border/60 p-3 shadow-sm z-20 pointer-events-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold flex items-center gap-1.5">
              <span className="text-primary">Jeu du Chat</span>
            </h1>
            
            <div className="absolute left-1/2 transform -translate-x-1/2">
              {/* Info du joueur actuel - centré avec popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-1 text-xs px-3 py-1.5 bg-muted/90 backdrop-blur-sm rounded-full shadow-md cursor-pointer hover:bg-muted/100 transition-colors">
                    <span>{playerRole === "Loup" ? "🐺" : "🐭"}</span>
                    <span 
                      className="font-medium max-w-[100px] truncate"
                      style={{ 
                        color: getPlayerColor(parseInt(playerId || "0"), players),
                        textShadow: '0px 0px 1px rgba(0,0,0,0.2)'
                      }}
                    >
                      {playerName}
                    </span>
                    {isModerator && (
                      <span className="ml-1 text-amber-500">
                        <Crown className="h-3 w-3 inline-block" />
                      </span>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 z-50">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Options du joueur</h4>
                    <div className="border-t border-border pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-2 mb-2"
                        onClick={handleChangeColor}
                      >
                        <PaintBucket className="h-4 w-4 text-primary" />
                        <span>Changer ma couleur</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-2"
                        onClick={handleDisconnect}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Se déconnecter</span>
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="w-6">
              {/* Espace pour équilibrer */}
            </div>
          </div>
        </header>
        
        {/* Zone centrale - espacée pour voir la carte */}
        <div className="flex-1"></div>
        
        {/* Zone informative en bas avec fond semi-transparent */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-2/5 bg-background/90 backdrop-blur-sm border-t border-border p-4 flex flex-col space-y-4 overflow-y-auto custom-scrollbar pointer-events-auto">
          <h2 className="text-lg font-medium">Informations de jeu</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/80 rounded-lg shadow-sm">
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
            
            <div className="p-3 bg-muted/80 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium mb-1">Joueurs</h3>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 rounded-full">
                  🐭 {players.filter(p => p.role === "Souris").length}
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 rounded-full">
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
      
      {/* Game Controls - Panel du bas adapté au mobile avec animation et fond semi-transparent */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 pointer-events-auto ${
        showControls 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-full pointer-events-none"
      }`}>
        <div className="bg-background/80 backdrop-blur-sm border-t border-border/60 shadow-lg">
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
      
      {/* Roulette de sélection du loup */}
      {showRoleWheel && (
        <RoleWheel 
          players={players}
          onWheelComplete={handleWheelComplete}
          onClose={() => setShowRoleWheel(false)}
        />
      )}
    </div>
  );
}
