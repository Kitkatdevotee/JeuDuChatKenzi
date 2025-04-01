import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // Utilise le thème sombre par défaut
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Bascule entre les thèmes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === "light" ? "dark" : "light"));
  };

  // Applique le thème au document HTML
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <Button 
      variant="secondary" 
      size="icon" 
      onClick={toggleTheme}
      className="fixed top-3 right-3 z-50 rounded-full w-8 h-8 bg-background/80 backdrop-blur-sm shadow-lg border border-border"
    >
      {theme === "light" ? 
        <Moon className="h-4 w-4 text-primary" /> : 
        <Sun className="h-4 w-4 text-yellow-400" />
      }
      <span className="sr-only">Changer de thème</span>
    </Button>
  );
}