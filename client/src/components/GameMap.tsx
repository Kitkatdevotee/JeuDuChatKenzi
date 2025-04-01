import { useEffect, useRef, useState } from "react";
import L from 'leaflet';
import { ZoomIn, ZoomOut, Locate, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

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
}

export default function GameMap({ players, polygonCoordinates }: GameMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const playersLayerRef = useRef<L.LayerGroup | null>(null);
  const zoneLayerRef = useRef<L.Polygon | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Centre sur Saint-Foy-l'Argentière, France
  const initialRegion = {
    latitude: 45.7456,
    longitude: 4.635,
    zoom: 15
  };
  
  // Initialize the map
  useEffect(() => {
    if (!mapRef.current && mapElementRef.current) {
      // Initialize map
      const map = L.map(mapElementRef.current, {
        zoomControl: false, // Nous ajouterons nos propres contrôles adaptés au mobile
        attributionControl: false // Pour un design plus épuré
      }).setView(
        [initialRegion.latitude, initialRegion.longitude], 
        initialRegion.zoom
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
  }, []);
  
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
      
      // Add player markers
      players.forEach(player => {
        const isWolf = player.role === "Loup";
        
        // Style adapté au thème (clair/sombre)
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="marker-pin ${
            isWolf ? 'bg-red-500 dark:bg-red-600' : 'bg-green-500 dark:bg-green-600'
          } shadow-lg flex items-center justify-center text-white rounded-full w-8 h-8 border-2 border-white dark:border-gray-800">
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
      
      {/* Bouton de thème sur la carte */}
      <ThemeToggle />
    </div>
  );
}
