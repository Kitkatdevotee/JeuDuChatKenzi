import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // Détermine le thème initial en fonction des préférences système
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

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
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 rounded-full w-10 h-10"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      <span className="sr-only">Changer de thème</span>
    </Button>
  );
}