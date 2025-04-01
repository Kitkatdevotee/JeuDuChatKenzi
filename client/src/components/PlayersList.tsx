import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersRound, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: number;
  username: string;
  role: string;
}

interface PlayersListProps {
  players: Player[];
}

export default function PlayersList({ players }: PlayersListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
        <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {players.map(player => (
            <li 
              key={player.id} 
              className="flex items-center justify-between p-2 bg-background/70 rounded-md border border-border text-sm"
            >
              <div className="flex items-center">
                <span 
                  className={`w-3 h-3 rounded-full mr-2 ${
                    player.role === "Loup" ? "bg-red-500" : "bg-green-500"
                  }`}
                ></span>
                <span className="font-medium truncate max-w-[7rem]">{player.username}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Badge 
                  variant={player.role === "Loup" ? "destructive" : "secondary"}
                  className="text-[0.65rem] h-5"
                >
                  {player.role === "Loup" ? "🐺 Loup" : "🐭 Souris"}
                </Badge>
                
                {/* Indicateur de géolocalisation */}
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" 
                      title="Localisation active"></span>
              </div>
            </li>
          ))}
          
          {players.length === 0 && (
            <li className="text-sm text-muted-foreground text-center py-3 italic">
              Aucun joueur connecté
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
