import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-1">
          Pseudo
        </Label>
        <Input
          id="pseudo"
          value={pseudo}
          onChange={handlePseudoChange}
          placeholder="Entrez un pseudo (4-16 caractères)"
          maxLength={16}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
        <p 
          className={`text-xs mt-1 ${
            pseudo.length > 0 
              ? (isPseudoValid ? "text-green-600" : "text-red-500") 
              : "text-gray-500"
          }`}
        >
          {pseudo.length > 0 && isPseudoValid 
            ? "Pseudo valide !" 
            : "Le pseudo doit contenir entre 4 et 16 caractères"}
        </p>
      </div>
      
      <Button
        type="submit"
        disabled={!isPseudoValid || isLoading}
        className={`w-full py-2 px-4 ${
          isPseudoValid ? "bg-primary hover:bg-blue-600" : "bg-gray-400"
        } text-white font-medium rounded-md shadow transition disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Chargement...
          </div>
        ) : (
          "Commencer le jeu"
        )}
      </Button>
    </form>
  );
}
