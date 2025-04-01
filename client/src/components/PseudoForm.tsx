import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogIn } from "lucide-react";

interface PseudoFormProps {
  onSubmit: (username: string) => void;
  isLoading: boolean;
}

export default function PseudoForm({ onSubmit, isLoading }: PseudoFormProps) {
  const [pseudo, setPseudo] = useState("");
  const [isPseudoValid, setIsPseudoValid] = useState(false);
  
  const handlePseudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPseudo(value);
    
    if (value.length >= 4 && value.length <= 16) {
      setIsPseudoValid(true);
    } else {
      setIsPseudoValid(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPseudoValid && !isLoading) {
      onSubmit(pseudo);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="pseudo" className="text-sm font-medium flex items-center">
          <User className="w-4 h-4 mr-1.5" />
          Choix du pseudo
        </Label>
        
        <div className="relative">
          <Input
            id="pseudo"
            value={pseudo}
            onChange={handlePseudoChange}
            placeholder="Entrez votre pseudo"
            maxLength={16}
            autoComplete="off"
            className="pl-3 pr-3 py-5 w-full text-base"
            autoFocus
            autoCapitalize="off"
            type="text"
          />
        </div>
        
        <div className="flex justify-between items-center text-xs px-1">
          <span className={`${
            isPseudoValid ? "text-green-500 dark:text-green-400" : "text-muted-foreground"
          }`}>
            {isPseudoValid ? "✓ Pseudo valide" : "Entre 4 et 16 caractères"}
          </span>
          <span className={`${pseudo.length > 0 ? "text-primary" : "text-muted-foreground"}`}>
            {pseudo.length}/16
          </span>
        </div>
      </div>
      
      <Button
        type="submit"
        disabled={!isPseudoValid || isLoading}
        className="w-full py-6 text-base font-medium"
        variant={isPseudoValid ? "default" : "secondary"}
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Connexion en cours...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" />
            <span>Entrer dans le jeu</span>
          </div>
        )}
      </Button>
    </form>
  );
}
