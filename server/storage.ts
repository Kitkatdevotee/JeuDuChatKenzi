import { 
  Player, InsertPlayer, 
  GameZone, InsertGameZone,
  GameSession, InsertGameSession,
  Coordinate
} from "@shared/schema";

// Interface for all game storage operations
export interface IStorage {
  // Player operations
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayerByUsername(username: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayerPosition(id: number, latitude: string, longitude: string): Promise<Player | undefined>;
  updatePlayerRole(id: number, role: string): Promise<Player | undefined>;
  
  // Game zone operations
  getGameZones(): Promise<GameZone[]>;
  getGameZone(id: number): Promise<GameZone | undefined>;
  createGameZone(zone: InsertGameZone): Promise<GameZone>;
  
  // Game session operations
  getGameSession(): Promise<GameSession | undefined>;
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: number, isRunning: boolean): Promise<GameSession | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private gameZones: Map<number, GameZone>;
  private gameSessions: Map<number, GameSession>;
  private playerId: number;
  private zoneId: number;
  private sessionId: number;

  constructor() {
    this.players = new Map();
    this.gameZones = new Map();
    this.gameSessions = new Map();
    this.playerId = 1;
    this.zoneId = 1;
    this.sessionId = 1;
  }

  // Player methods
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByUsername(username: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(
      (player) => player.username === username
    );
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.playerId++;
    // Ensure all required fields are present with defaults if needed
    const player: Player = { 
      id,
      username: insertPlayer.username,
      role: insertPlayer.role || "Mouse", 
      latitude: insertPlayer.latitude,
      longitude: insertPlayer.longitude,
      isActive: insertPlayer.isActive !== undefined ? insertPlayer.isActive : true
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayerPosition(id: number, latitude: string, longitude: string): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, latitude, longitude };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async updatePlayerRole(id: number, role: string): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, role };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Game zone methods
  async getGameZones(): Promise<GameZone[]> {
    return Array.from(this.gameZones.values());
  }

  async getGameZone(id: number): Promise<GameZone | undefined> {
    return this.gameZones.get(id);
  }

  async createGameZone(insertZone: InsertGameZone): Promise<GameZone> {
    const id = this.zoneId++;
    const zone: GameZone = { ...insertZone, id };
    this.gameZones.set(id, zone);
    return zone;
  }

  // Game session methods
  async getGameSession(): Promise<GameSession | undefined> {
    // For simplicity, we'll assume there's only one active game session at a time
    return this.gameSessions.get(1);
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = this.sessionId++;
    const session: GameSession = { 
      id,
      isRunning: insertSession.isRunning !== undefined ? insertSession.isRunning : false,
      zoneId: insertSession.zoneId !== undefined ? insertSession.zoneId : null 
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async updateGameSession(id: number, isRunning: boolean): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, isRunning };
    this.gameSessions.set(id, updatedSession);
    return updatedSession;
  }
}

export const storage = new MemStorage();
