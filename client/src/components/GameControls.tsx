import { Button } from "@/components/ui/button";

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
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Button
            onClick={onDrawZone}
            disabled={isDrawingZone}
            className="flex-1 py-2 px-4 bg-primary text-white font-medium rounded-md shadow hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {isDrawingZone ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Dessin...
              </div>
            ) : (
              <>
                <i className="fas fa-draw-polygon mr-2"></i> Dessiner Zone
              </>
            )}
          </Button>
          
          <Button
            onClick={onToggleGame}
            disabled={isTogglingGame}
            className={`flex-1 py-2 px-4 ${
              gameRunning 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-green-500 hover:bg-green-600"
            } text-white font-medium rounded-md shadow transition focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
              gameRunning ? "focus:ring-red-500" : "focus:ring-green-500"
            }`}
          >
            {isTogglingGame ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Chargement...
              </div>
            ) : (
              <>
                <i className={`fas ${gameRunning ? "fa-stop" : "fa-play"} mr-2`}></i>
                {gameRunning ? "Arrêter le jeu" : "Démarrer le jeu"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
