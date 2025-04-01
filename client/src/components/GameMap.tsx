import { useEffect, useRef } from "react";
import L from 'leaflet';

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
  
  // Initialize the map
  useEffect(() => {
    if (!mapRef.current && mapElementRef.current) {
      const initialRegion = {
        latitude: 45.7456,
        longitude: 4.635,
        zoom: 15
      };
      
      // Initialize map
      const map = L.map(mapElementRef.current).setView(
        [initialRegion.latitude, initialRegion.longitude], 
        initialRegion.zoom
      );
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Create layer for players
      const playersLayer = L.layerGroup().addTo(map);
      
      mapRef.current = map;
      playersLayerRef.current = playersLayer;
      
      // Force map to re-render if container was not properly sized
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
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
  }, [mapElementRef.current]);
  
  // Update player markers
  useEffect(() => {
    if (mapRef.current && playersLayerRef.current) {
      // Clear existing markers
      playersLayerRef.current.clearLayers();
      
      // Add player markers
      players.forEach(player => {
        const isWolf = player.role === "Loup";
        
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="marker-pin ${isWolf ? 'bg-red-500' : 'bg-green-500'} shadow-lg flex items-center justify-center text-white rounded-full w-8 h-8 border-2 border-white">
                  <span>${isWolf ? '🐺' : '🐭'}</span>
                 </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        
        const marker = L.marker(
          [parseFloat(player.latitude), parseFloat(player.longitude)], 
          { icon }
        ).addTo(playersLayerRef.current!);
        
        marker.bindPopup(`${player.username} (${player.role})`);
      });
    }
  }, [players]);
  
  // Update zone polygon
  useEffect(() => {
    if (mapRef.current) {
      // Remove existing polygon
      if (zoneLayerRef.current) {
        zoneLayerRef.current.remove();
        zoneLayerRef.current = null;
      }
      
      // Add new polygon if coordinates exist
      if (polygonCoordinates.length > 0) {
        const latLngs = polygonCoordinates.map(coord => [coord.latitude, coord.longitude]);
        const polygon = L.polygon(latLngs as L.LatLngExpression[], {
          color: '#3b82f6',
          fillColor: 'rgba(59, 130, 246, 0.2)',
          weight: 2
        }).addTo(mapRef.current);
        
        zoneLayerRef.current = polygon;
      }
    }
  }, [polygonCoordinates]);
  
  return (
    <div ref={mapElementRef} className="h-full w-full" style={{ zIndex: 0 }}></div>
  );
}
