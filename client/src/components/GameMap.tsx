import { useEffect, useRef, useState } from "react";
import L from 'leaflet';
import 'leaflet-draw';
import { ZoomIn, ZoomOut, Locate, Target, Save, Check, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Fix Leaflet's default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Player {
  id: number;
  username: string;
  role: string;
  latitude: string;
  longitude: string;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface GameMapProps {
  players: Player[];
  polygonCoordinates: Coordinate[];
  isDrawingMode?: boolean;
  onZoneDrawn?: (coordinates: Coordinate[]) => void;
  isModerator?: boolean;
}

export default function GameMap({ 
  players, 
  polygonCoordinates, 
  isDrawingMode = false, 
  onZoneDrawn,
  isModerator = false
}: GameMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const playersLayerRef = useRef<L.LayerGroup | null>(null);
  const zoneLayerRef = useRef<L.Polygon | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasGeolocation, setHasGeolocation] = useState<boolean | null>(null);
  const [userPosition, setUserPosition] = useState<{latitude: number, longitude: number} | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnPolygon, setHasDrawnPolygon] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<Coordinate[]>([]);
  
  // Centre sur Saint-Foy-l'Argentière, France
  const initialRegion = {
    latitude: 45.7456,
    longitude: 4.635,
    zoom: 15
  };
  
  // Vérifier si la géolocalisation est disponible
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition({ latitude, longitude });
          setHasGeolocation(true);
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          setHasGeolocation(false);
        }
      );
    } else {
      setHasGeolocation(false);
    }
  }, []);
  
  // Initialize the map
  useEffect(() => {
    // Ne pas initialiser la carte si la géolocalisation n'est pas disponible
    if (!hasGeolocation || !userPosition) return;
    
    if (!mapRef.current && mapElementRef.current) {
      // Initialize map
      const map = L.map(mapElementRef.current, {
        zoomControl: false, // Nous ajouterons nos propres contrôles adaptés au mobile
        attributionControl: false // Pour un design plus épuré
      }).setView(
        [userPosition.latitude, userPosition.longitude], 
        16  // Zoom sur la position de l'utilisateur
      );
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      
      // Ajout de l'attribution en bas à gauche
      L.control.attribution({
        position: 'bottomleft'
      }).addTo(map);
      
      // Create layer for players
      const playersLayer = L.layerGroup().addTo(map);
      
      // Ajouter un marqueur pour la position de l'utilisateur
      const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-pin bg-blue-500 dark:bg-blue-600 shadow-lg pulse-blue flex items-center justify-center text-white rounded-full w-8 h-8 border-2 border-white dark:border-gray-800">
                <span>📍</span>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      L.marker([userPosition.latitude, userPosition.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup("Votre position");
      
      // Initialize drawing features
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;
      
      // Configure draw control
      const drawControl = new L.Control.Draw({
        draw: {
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: '<strong>Erreur:</strong> Les polygones ne peuvent pas se croiser!'
            },
            shapeOptions: {
              color: '#3b82f6',
              fillOpacity: 0.2
            }
          }
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      
      // Add the draw control to the map only if in drawing mode
      if (isDrawingMode && isModerator) {
        map.addControl(drawControl);
        drawControlRef.current = drawControl;
      }
      
      // Handle drawn items
      map.on(L.Draw.Event.CREATED, function (e: any) {
        const layer = e.layer;
        
        if (layer instanceof L.Polygon) {
          // Clear previous drawn items
          drawnItems.clearLayers();
          
          // Add the new layer to drawnItems
          drawnItems.addLayer(layer);
          
          // Extract coordinates
          const latLngs = layer.getLatLngs()[0] as L.LatLng[];
          const coordinates = latLngs.map((latLng: L.LatLng) => ({
            latitude: latLng.lat,
            longitude: latLng.lng
          }));
          
          setDrawnPolygon(coordinates as Coordinate[]);
          setHasDrawnPolygon(true);
          
          // Create an inverse polygon to highlight the outside area in red
          const bounds = map.getBounds();
          const outerBounds = [
            bounds.getNorthWest(),
            bounds.getNorthEast(),
            bounds.getSouthEast(),
            bounds.getSouthWest()
          ];
          
          // Check if zoneLayerRef.current exists and remove it
          if (zoneLayerRef.current) {
            zoneLayerRef.current.remove();
          }
          
          // Create the inverse polygon (highlighting outside area in red)
          const inversePolygon = L.polygon([
            outerBounds,
            latLngs as L.LatLngExpression[]
          ], {
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.2,
            weight: 2
          }).addTo(map);
          
          zoneLayerRef.current = inversePolygon;
          
          // Show toast notification
          toast({
            title: "Zone dessinée",
            description: "Zone définie avec succès. Vous pouvez l'enregistrer.",
          });
        }
      });
      
      mapRef.current = map;
      playersLayerRef.current = playersLayer;
      
      // Force map to re-render if container was not properly sized
      setTimeout(() => {
        map.invalidateSize();
        setIsMapReady(true);
      }, 200);
    }
    
    // Clean up function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        playersLayerRef.current = null;
        zoneLayerRef.current = null;
      }
    };
  }, [hasGeolocation, userPosition, isDrawingMode, isModerator]);
  
  // Fonctions de zoom
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };
  
  // Fonction pour centrer sur la position de l'utilisateur
  const handleCenterOnUser = () => {
    if (mapRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.setView([latitude, longitude], 16);
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  };
  
  // Fonction pour recentrer sur la zone de jeu
  const handleCenterOnZone = () => {
    if (mapRef.current) {
      mapRef.current.setView([initialRegion.latitude, initialRegion.longitude], initialRegion.zoom);
    }
  };
  
  // Update player markers
  useEffect(() => {
    if (mapRef.current && playersLayerRef.current) {
      // Clear existing markers
      playersLayerRef.current.clearLayers();
      
      // Couleurs pour les joueurs
      const getPlayerColor = (id: number): string => {
        const PLAYER_COLORS = [
          "#ff7e5f", "#feb47b", "#ffae4a", "#f7c59f", 
          "#9be7ff", "#66e0ff", "#32a1ff", "#0055ff",
          "#b2fab4", "#85ef8f", "#5ae361", "#38c938",
          "#d783ff", "#ad54ff", "#8429ff", "#6c0aef",
          "#ff77a8", "#ff4d94", "#ff1d79", "#e5005e"
        ];
        return PLAYER_COLORS[id % PLAYER_COLORS.length];
      };
      
      // Add player markers
      players.forEach(player => {
        const isWolf = player.role === "Loup";
        const playerColor = getPlayerColor(player.id);
        
        // Style adapté au thème (clair/sombre)
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="marker-pin shadow-lg flex items-center justify-center text-white rounded-full w-8 h-8 border-2 border-white dark:border-gray-800"
                      style="background-color: ${playerColor}">
                  <span>${isWolf ? '🐺' : '🐭'}</span>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        
        const marker = L.marker(
          [parseFloat(player.latitude), parseFloat(player.longitude)], 
          { icon }
        ).addTo(playersLayerRef.current!);
        
        // Popup adaptée au thème
        marker.bindPopup(`
          <div class="dark:bg-gray-800 dark:text-white p-1 rounded text-center">
            <b>${player.username}</b><br/>
            <span class="text-xs">${isWolf ? '🐺 Loup' : '🐭 Souris'}</span>
          </div>
        `);
      });
    }
  }, [players, isMapReady]);
  
  // Update zone polygon
  useEffect(() => {
    if (mapRef.current && isMapReady) {
      // Remove existing polygon
      if (zoneLayerRef.current) {
        zoneLayerRef.current.remove();
        zoneLayerRef.current = null;
      }
      
      // Add new polygon if coordinates exist
      if (polygonCoordinates.length > 0) {
        const latLngs = polygonCoordinates.map(coord => [coord.latitude, coord.longitude]);
        const polygon = L.polygon(latLngs as L.LatLngExpression[], {
          color: 'var(--primary)',
          fillColor: 'rgba(59, 130, 246, 0.15)',
          weight: 3,
          dashArray: '5, 5',
          lineCap: 'round'
        }).addTo(mapRef.current);
        
        // Ajout d'un popup sur la zone
        polygon.bindPopup("Zone de jeu autorisée");
        
        zoneLayerRef.current = polygon;
        
        // Zoomer pour inclure tout le polygone
        if (polygonCoordinates.length > 2) {
          mapRef.current.fitBounds(polygon.getBounds(), {
            padding: [50, 50],
            maxZoom: 16
          });
        }
      }
    }
  }, [polygonCoordinates, isMapReady]);
  
  // Si on vérifie encore la géolocalisation (état initial)
  if (hasGeolocation === null) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-background">
        <div className="text-center p-5 bg-muted/50 rounded-lg max-w-md">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Vérification de la géolocalisation...</h3>
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous vérifions l'accès à votre position.
          </p>
        </div>
      </div>
    );
  }
  
  // Si la géolocalisation n'est pas disponible
  if (hasGeolocation === false) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-background">
        <div className="text-center p-5 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md border border-red-200 dark:border-red-900">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Locate className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">Accès à la position refusé</h3>
          <p className="text-muted-foreground mb-4">
            Ce jeu nécessite l'accès à votre géolocalisation pour fonctionner. 
            Veuillez autoriser l'accès à votre position dans les paramètres de votre navigateur.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="destructive"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }
  
  // Function to handle saving the drawn zone
  const handleSaveZone = () => {
    if (hasDrawnPolygon && drawnPolygon.length > 0 && onZoneDrawn) {
      onZoneDrawn(drawnPolygon);
      toast({
        title: "Zone enregistrée",
        description: "La zone de jeu a été enregistrée avec succès.",
      });
      
      // Reset drawing state
      setIsDrawing(false);
      setHasDrawnPolygon(false);
    }
  };
  
  // Function to start drawing mode
  const handleStartDrawing = () => {
    setIsDrawing(true);
    
    if (mapRef.current && drawnItemsRef.current) {
      // Clear previous drawings
      drawnItemsRef.current.clearLayers();
      
      // Remove any existing zone highlight
      if (zoneLayerRef.current) {
        zoneLayerRef.current.remove();
        zoneLayerRef.current = null;
      }
      
      // Enable drawing
      if (mapRef.current) {
        // Trigger the polygon drawing tool programmatically
        new L.Draw.Polygon(mapRef.current as any).enable();
      }
    }
  };
  
  // Function to cancel drawing
  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setHasDrawnPolygon(false);
    
    if (mapRef.current && drawnItemsRef.current) {
      // Clear drawings
      drawnItemsRef.current.clearLayers();
      
      // Remove zone highlight
      if (zoneLayerRef.current) {
        zoneLayerRef.current.remove();
        zoneLayerRef.current = null;
      }
    }
  };

  // Rendu normal de la carte avec géolocalisation activée
  return (
    <div className="relative h-full w-full">
      <div ref={mapElementRef} className="h-full w-full"></div>
      
      {/* Contrôles de carte adaptés au mobile */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handleZoomIn}
          className="h-10 w-10 bg-background/80 backdrop-blur-sm shadow-lg rounded-full"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handleZoomOut}
          className="h-10 w-10 bg-background/80 backdrop-blur-sm shadow-lg rounded-full"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handleCenterOnUser}
          className="h-10 w-10 bg-background/80 backdrop-blur-sm shadow-lg rounded-full"
        >
          <Locate className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handleCenterOnZone}
          className="h-10 w-10 bg-background/80 backdrop-blur-sm shadow-lg rounded-full"
        >
          <Target className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Position data visible uniquement pour les administrateurs */}
      {userPosition && (
        <div className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs">
          Votre position: {userPosition.latitude.toFixed(6)}, {userPosition.longitude.toFixed(6)}
        </div>
      )}
      
      {/* Zone Drawing Controls (only for moderator) */}
      {isModerator && isDrawingMode && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
            <div className="flex flex-col gap-2">
              {!isDrawing && !hasDrawnPolygon ? (
                <>
                  <div className="text-center mb-1">
                    <Badge variant="outline" className="mb-2">
                      <Edit className="w-3 h-3 mr-1" />
                      <span>Mode dessin de zone</span>
                    </Badge>
                    <p className="text-xs text-muted-foreground mb-2">
                      Dessinez une zone sur la carte pour définir la zone de jeu autorisée
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={handleStartDrawing}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Commencer à dessiner</span>
                  </Button>
                </>
              ) : hasDrawnPolygon ? (
                <>
                  <div className="text-center mb-1">
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mb-2">
                      <Check className="w-3 h-3 mr-1" />
                      <span>Zone dessinée</span>
                    </Badge>
                    <p className="text-xs text-muted-foreground mb-2">
                      L'extérieur de la zone est surligné en rouge
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={handleCancelDrawing}
                      className="flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Annuler</span>
                    </Button>
                    <Button 
                      size="sm"
                      variant="default"
                      onClick={handleSaveZone}
                      className="flex items-center justify-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Enregistrer</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-1">
                    <Badge variant="outline" className="mb-2 animate-pulse">
                      <Edit className="w-3 h-3 mr-1" />
                      <span>Dessin en cours...</span>
                    </Badge>
                    <p className="text-xs text-muted-foreground mb-2">
                      Cliquez sur la carte pour ajouter des points, double-cliquez pour terminer
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    variant="destructive"
                    onClick={handleCancelDrawing}
                    className="flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Annuler le dessin</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
