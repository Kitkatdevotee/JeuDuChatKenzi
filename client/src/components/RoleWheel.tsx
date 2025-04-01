import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Player } from "@shared/schema";

interface RoleWheelProps {
  players: Player[];
  onWheelComplete: (selectedPlayerId: number) => void;
  onClose: () => void;
}

export default function RoleWheel({ players, onWheelComplete, onClose }: RoleWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDegrees, setSpinDegrees] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Filtrer seulement les joueurs actifs
  const activePlayersList = players.filter(player => player.isActive);
  
  // Si pas assez de joueurs, on ne peut pas démarrer la roulette
  const hasEnoughPlayers = activePlayersList.length >= 2;
  
  // Fonction pour faire tourner la roue
  const spinWheel = () => {
    if (!hasEnoughPlayers) {
      toast({
        title: "Pas assez de joueurs",
        description: "Il doit y avoir au moins 2 joueurs pour démarrer la roulette.",
        variant: "destructive"
      });
      return;
    }
    
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Calculer un angle aléatoire pour la rotation (entre 1440° et 2160°)
    // afin qu'il fasse entre 4 et 6 tours complets
    const spinAngle = 1440 + Math.random() * 720;
    
    // Calculer le segment qui sera sélectionné
    const segmentSize = 360 / activePlayersList.length;
    const normalizedEndAngle = spinAngle % 360;
    const selectedIndex = Math.floor(normalizedEndAngle / segmentSize);
    
    // Définir l'angle de rotation
    setSpinDegrees(spinAngle);
    setSelectedSegment(selectedIndex);
    
    // Après l'animation, informer du résultat
    setTimeout(() => {
      const selectedPlayer = activePlayersList[activePlayersList.length - 1 - selectedIndex];
      
      if (selectedPlayer) {
        toast({
          title: "La roulette a choisi !",
          description: `${selectedPlayer.username} sera le Loup pour cette partie !`,
        });
        
        onWheelComplete(selectedPlayer.id);
      }
      
      // Réinitialiser pour permettre un nouveau spin si nécessaire
      setTimeout(() => {
        setIsSpinning(false);
      }, 1000);
    }, 5000); // attendre 5 secondes pour la fin de l'animation
  };
  
  // Générer les segments de la roue avec les couleurs alternatives
  const renderWheelSegments = () => {
    if (!hasEnoughPlayers) {
      return (
        <div className="w-full h-full flex items-center justify-center rounded-full">
          <p className="text-center text-sm font-medium">
            Au moins 2 joueurs<br/>nécessaires pour<br/>démarrer la roulette
          </p>
        </div>
      );
    }
    
    const segments = activePlayersList.map((player, index) => {
      const segmentSize = 360 / activePlayersList.length;
      const startAngle = index * segmentSize;
      const endAngle = startAngle + segmentSize;
      
      const clipPath = getSegmentClipPath(startAngle, endAngle, 150);
      
      // Alterner les couleurs pour mieux distinguer les segments
      const bgColor = index % 2 === 0 ? 'bg-primary/20' : 'bg-primary/30';
      
      return (
        <div 
          key={player.id}
          className={`absolute top-0 left-0 w-full h-full ${bgColor} flex items-center justify-center`}
          style={{ 
            clipPath: clipPath,
            transform: `rotate(${startAngle}deg)` 
          }}
        >
          <div 
            className="absolute text-xs font-medium"
            style={{ 
              transform: `translateY(-60px) rotate(${180 - startAngle - segmentSize/2}deg)`,
              maxWidth: '100px',
              textAlign: 'center'
            }}
          >
            {player.username}
          </div>
        </div>
      );
    });
    
    return segments;
  };
  
  // Fonction pour générer le clip-path d'un segment circulaire
  const getSegmentClipPath = (startAngle: number, endAngle: number, radius: number) => {
    // Convertir les angles en radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // Calculer les coordonnées
    const x1 = radius + radius * Math.cos(startRad);
    const y1 = radius + radius * Math.sin(startRad);
    const x2 = radius + radius * Math.cos(endRad);
    const y2 = radius + radius * Math.sin(endRad);
    
    // Large-arc-flag est 0 pour les arcs inférieurs à 180 degrés
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    // polygon avec le centre, le point de départ, l'arc et le retour au centre
    return `polygon(50% 50%, ${x1}px ${y1}px, ${x2}px ${y2}px)`;
  };
  
  // Animation CSS pour faire tourner la roue en douceur
  const wheelStyle = {
    transform: `rotate(${spinDegrees}deg)`,
    transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
  };
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background/95 rounded-xl shadow-lg p-6 w-full max-w-md flex flex-col items-center space-y-6">
        <h2 className="text-xl font-bold">Qui sera le Loup ?</h2>
        
        <div className="relative w-[300px] h-[300px]">
          {/* Triangle indicateur */}
          <div className="absolute top-0 left-1/2 -ml-4 z-10">
            <div className="w-8 h-8 bg-red-500 clip-triangle"></div>
          </div>
          
          {/* Roue */}
          <div 
            ref={wheelRef}
            className="w-full h-full rounded-full bg-muted border-4 border-primary relative overflow-hidden"
            style={wheelStyle}
          >
            {renderWheelSegments()}
          </div>
        </div>
        
        <div className="flex gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={isSpinning}
          >
            Annuler
          </Button>
          
          <Button 
            variant="default" 
            onClick={spinWheel}
            className="flex-1"
            disabled={!hasEnoughPlayers || isSpinning}
          >
            {isSpinning ? "Sélection..." : "Tourner la roue"}
          </Button>
        </div>
      </div>
    </div>
  );
}