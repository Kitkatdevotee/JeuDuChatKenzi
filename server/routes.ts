import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, insertGameZoneSchema, insertGameSessionSchema, validatePlayerSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/" 
  });
  
  const clients = new Set();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });
  
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
      
      // Si le joueur existe mais est inactif, permettre la réutilisation du pseudo
      if (existingPlayer) {
        if (!existingPlayer.isActive) {
          // Réactiver le joueur avec les nouvelles informations
          const updatedPlayer = await storage.updatePlayerStatus(existingPlayer.id, true);
          
          if (updatedPlayer) {
            // Mise à jour de la position si elle a changé
            if (validatedData.latitude !== updatedPlayer.latitude || 
                validatedData.longitude !== updatedPlayer.longitude) {
              await storage.updatePlayerPosition(
                updatedPlayer.id, 
                validatedData.latitude, 
                validatedData.longitude
              );
            }
            
            // Broadcast à tous les clients
            broadcastUpdate({
              type: 'PLAYER_REJOINED',
              data: updatedPlayer
            });
            
            return res.status(200).json(updatedPlayer);
          }
        } else {
          // Si le joueur est actif, renvoyer une erreur
          return res.status(409).json({ message: 'Player with this username already exists' });
        }
      }
      
      // Créer un nouveau joueur
      const player = await storage.createPlayer(validatedData);
      
      // Broadcast à tous les clients
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
  
  // Déconnecter un joueur (marquer comme inactif)
  app.patch('/api/players/:id/disconnect', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const player = await storage.deactivatePlayer(id);
      
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Broadcast to all clients
      broadcastUpdate({
        type: 'PLAYER_DISCONNECTED',
        data: player
      });
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: 'Error disconnecting player' });
    }
  });
  
  // Mettre à jour le rôle d'un joueur (Loup ou Souris)
  app.patch('/api/players/:id/role', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!role || !["Loup", "Souris"].includes(role)) {
        return res.status(400).json({ message: 'Role must be "Loup" or "Souris"' });
      }
      
      const player = await storage.updatePlayerRole(id, role);
      
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Broadcast to all clients
      broadcastUpdate({
        type: 'PLAYER_ROLE_CHANGED',
        data: player
      });
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: 'Error updating player role' });
    }
  });
  
  // Mettre à jour la couleur d'un joueur
  app.patch('/api/players/:id/color', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { color } = req.body;
      
      if (!color) {
        return res.status(400).json({ message: 'Color is required' });
      }
      
      const player = await storage.updatePlayerColor(id, color);
      
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Broadcast to all clients
      broadcastUpdate({
        type: 'PLAYER_COLOR_CHANGED',
        data: player
      });
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: 'Error updating player color' });
    }
  });
  
  // Get active players only
  app.get('/api/players/active', async (req, res) => {
    try {
      const players = await storage.getActivePlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching active players' });
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
