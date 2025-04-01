// Types communs pour l'application
export interface Player {
  id: number;
  username: string;
  role: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  color?: string | null;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface GameSession {
  id: number;
  isRunning: boolean;
  zoneId: number | null;
}