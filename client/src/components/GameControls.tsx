import { Button } from "@/components/ui/button";
import { MapPinned, Play, Square, Loader2 } from "lucide-react";

interface GameControlsProps {
  onDrawZone: () => void;
  onToggleGame: () => void;
  gameRunning: boolean;
  isDrawingZone: boolean;
  isTogglingGame: boolean;
}

export default function GameControls({ 
  onDrawZone, 
  onToggleGame, 
  gameRunning,
  isDrawingZone,
  isTogglingGame
}: GameControlsProps) {
  return (
    <div className="mobile-panel">
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onDrawZone}
          disabled={isDrawingZone}
          variant="outline"
          size="lg"
          className="h-14 text-base relative"
        >
          {isDrawingZone ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Création...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <MapPinned className="h-4 w-4" />
              <span>Définir Zone</span>
            </div>
          )}
        </Button>
        
        <Button
          onClick={onToggleGame}
          disabled={isTogglingGame}
          variant={gameRunning ? "destructive" : "default"}
          size="lg"
          className="h-14 text-base relative"
        >
          {isTogglingGame ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Changement...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {gameRunning ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{gameRunning ? "Arrêter" : "Démarrer"}</span>
            </div>
          )}
        </Button>
      </div>
      
      {/* Indicateur de statut du jeu */}
      <div className="mt-3 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
          gameRunning 
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
            : "bg-muted text-muted-foreground"
        }`}>
          <span className={`h-1.5 w-1.5 mr-1.5 rounded-full ${
            gameRunning 
              ? "bg-green-500 animate-pulse" 
              : "bg-muted-foreground"
          }`}></span>
          {gameRunning ? "Jeu en cours" : "Jeu en attente de démarrage"}
        </div>
      </div>
    </div>
  );
}
