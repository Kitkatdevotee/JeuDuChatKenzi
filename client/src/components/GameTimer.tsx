
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";

interface GameTimerProps {
  duration: number;
  onComplete: () => void;
  variant?: "warning" | "default";
}

export default function GameTimer({ duration, onComplete, variant = "default" }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Badge variant={variant === "warning" ? "destructive" : "default"}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </Badge>
  );
}
