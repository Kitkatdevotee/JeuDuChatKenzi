import { useState } from "react";
import { Player, Coordinate, GameSession } from "@/lib/types";

export default function useGame() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<Coordinate[]>([]);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  
  return {
    // State
    players,
    gameRunning,
    polygonCoordinates,
    gameSession,
    
    // State setters
    setPlayers,
    setGameRunning,
    setPolygonCoordinates,
    setGameSession
  };
}
