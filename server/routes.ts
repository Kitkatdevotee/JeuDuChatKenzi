import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, insertGameZoneSchema, insertGameSessionSchema, validatePlayerSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket for real-time updates (disabled for now to check basic app functionality)
  /*
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/" 
  });
  */
  // Use a dummy client list for now
  const dummyClients = new Set();
  
  // Send updates to all connected clients (temporarily disabled)
  const broadcastUpdate = (data: any) => {
    // Disabled for now - will be re-enabled once WebSockets work
    console.log("Would broadcast:", data.type);
  };

  // === Player Routes ===
  
  // Get all players
  app.get('/api/players', async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching players' });
    }
  });
  
  // Create a new player
  app.post('/api/players', async (req, res) => {
    try {
      const validatedData = validatePlayerSchema.parse(req.body);
      const existingPlayer = await storage.getPlayerByUsername(validatedData.username);
      
      if (existingPlayer) {
        return res.status(409).json({ message: 'Player with this username already exists' });
      }
      
      const player = await storage.createPlayer(validatedData);
      
      // Broadcast to all clients
      broadcastUpdate({
        type: 'PLAYER_JOINED',
        data: player
      });
      
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: 'Error creating player' });
    }
  });
  
  // Update player position
  app.patch('/api/players/:id/position', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }
      
      const player = await storage.updatePlayerPosition(id, latitude, longitude);
      
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Broadcast to all clients
      broadcastUpdate({
        type: 'PLAYER_MOVED',
        data: player
      });
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: 'Error updating player position' });
    }
  });
  
  // === Game Zone Routes ===
  
  // Get all game zones
  app.get('/api/zones', async (req, res) => {
    try {
      const zones = await storage.getGameZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching game zones' });
    }
  });
  
  // Create a new game zone
  app.post('/api/zones', async (req, res) => {
    try {
      const validatedData = insertGameZoneSchema.parse(req.body);
      const zone = await storage.createGameZone(validatedData);
      
      // Broadcast to all clients
      broadcastUpdate({
        type: 'ZONE_CREATED',
        data: zone
      });
      
      res.status(201).json(zone);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: 'Error creating game zone' });
    }
  });
  
  // === Game Session Routes ===
  
  // Get current game session
  app.get('/api/session', async (req, res) => {
    try {
      let session = await storage.getGameSession();
      
      // Create a session if one doesn't exist
      if (!session) {
        session = await storage.createGameSession({
          isRunning: false,
          zoneId: null
        });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching game session' });
    }
  });
  
  // Update game session (start/stop)
  app.patch('/api/session/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isRunning } = req.body;
      
      if (isRunning === undefined) {
        return res.status(400).json({ message: 'isRunning is required' });
      }
      
      const session = await storage.updateGameSession(id, isRunning);
      
      if (!session) {
        return res.status(404).json({ message: 'Game session not found' });
      }
      
      // Broadcast to all clients
      broadcastUpdate({
        type: 'GAME_STATE_CHANGED',
        data: session
      });
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Error updating game session' });
    }
  });

  return httpServer;
}
