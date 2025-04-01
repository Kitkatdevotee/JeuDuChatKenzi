import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  UsersRound, ChevronUp, ChevronDown, LogOut, 
  Crown, Edit, UserCog, Users, Zap, Play, Pause
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface Player {
  id: number;
  username: string;
  role: string;
  isActive?: boolean;
}

interface PlayersListProps {
  players: Player[];
  onDisconnect?: () => void;
  isModerator?: boolean;
}

// Tableau de couleurs pour les joueurs
const PLAYER_COLORS = [
  "#ff7e5f", "#feb47b", "#ffae4a", "#f7c59f", 
  "#9be7ff", "#66e0ff", "#32a1ff", "#0055ff",
  "#b2fab4", "#85ef8f", "#5ae361", "#38c938",
  "#d783ff", "#ad54ff", "#8429ff", "#6c0aef",
  "#ff77a8", "#ff4d94", "#ff1d79", "#e5005e"
];

// Fonction pour générer une couleur stable basée sur l'ID du joueur
function getPlayerColor(id: number): string {
  return PLAYER_COLORS[id % PLAYER_COLORS.length];
}

export default function PlayersList({ players, onDisconnect, isModerator = false }: PlayersListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentPlayerId = parseInt(localStorage.getItem("playerId") || "0");
  const currentPlayerName = localStorage.getItem("playerName") || "";

  // Vérifier si le joueur actuel est Kitkatdevotee (modérateur unique)
  const isKitkatdevotee = currentPlayerName === "Kitkatdevotee";
  
  // Déterminer si on affiche les contrôles modérateur
  const showModeratorControls = isModerator || isKitkatdevotee;

  // Pour mobile, on permet de réduire/agrandir la liste
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <UsersRound className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Liste des joueurs ({players.length})</h3>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={toggleExpanded}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {players.map(player => {
              const playerColor = getPlayerColor(player.id);
              const isSelf = player.id === currentPlayerId;
              
              return (
                <li 
                  key={player.id} 
                  className={`flex items-center justify-between p-2 rounded-md border ${
                    isSelf 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-background/70 border-border"
                  } text-sm`}
                >
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span 
                            className="w-4 h-4 rounded-full mr-2 border border-white dark:border-gray-700 flex-shrink-0"
                            style={{ backgroundColor: playerColor }}
                          ></span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Couleur du joueur</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <span className="font-medium truncate max-w-[7rem]">
                      {player.username}
                      {isSelf && <span className="text-xs ml-1 opacity-70">(vous)</span>}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={player.role === "Loup" ? "destructive" : "secondary"}
                      className="text-[0.65rem] h-5"
                    >
                      {player.role === "Loup" ? "🐺 Loup" : "🐭 Souris"}
                    </Badge>
                    
                    {/* Indicateur de géolocalisation */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Localisation active</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </li>
              );
            })}
            
            {players.length === 0 && (
              <li className="text-sm text-muted-foreground text-center py-3 italic">
                Aucun joueur connecté
              </li>
            )}
          </ul>
          
          {/* Section modérateur */}
          {showModeratorControls && (
            <div className="mt-4 border-t border-border pt-4 mb-4">
              <div className="flex items-center mb-2">
                <Crown className="w-4 h-4 text-amber-500 mr-2" />
                <h3 className="text-sm font-medium">Contrôles Modérateur</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-1 h-9"
                >
                  <Play className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs">Démarrer jeu</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-1 h-9"
                >
                  <Pause className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs">Arrêter jeu</span>
                </Button>
              </div>
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full flex items-center gap-2 mb-2"
              >
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Définir la zone de jeu</span>
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full flex items-center gap-2"
              >
                <UserCog className="h-4 w-4" />
                <span>Gérer les rôles</span>
              </Button>
              
              <div className="text-center mt-3 mb-1">
                <Badge variant="outline" className="bg-primary/5">
                  <Crown className="w-3 h-3 text-amber-500 mr-1" />
                  <span className="text-xs">Hôte: Kitkatdevotee</span>
                </Badge>
              </div>
            </div>
          )}
          
          {/* Bouton déconnecter */}
          <div className={`${showModeratorControls ? "" : "mt-4 border-t border-border pt-4"}`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2"
              onClick={onDisconnect}
            >
              <LogOut className="h-4 w-4" />
              <span>Se déconnecter</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
