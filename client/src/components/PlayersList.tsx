import { Card } from "@/components/ui/card";

interface Player {
  id: number;
  username: string;
  role: string;
}

interface PlayersListProps {
  players: Player[];
}

export default function PlayersList({ players }: PlayersListProps) {
  return (
    <Card className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-3 max-w-xs w-full">
      <h3 className="font-medium text-sm text-gray-700 mb-2">Joueurs</h3>
      <ul className="space-y-2">
        {players.map(player => (
          <li key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <span 
                className={`w-2 h-2 rounded-full ${
                  player.role === "Loup" ? "bg-red-500" : "bg-green-500"
                } mr-2`}
              ></span>
              <span className="text-sm font-medium">{player.username}</span>
            </div>
            <span 
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                player.role === "Loup" 
                  ? "bg-red-100 text-red-800" 
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {player.role}
            </span>
          </li>
        ))}
        
        {players.length === 0 && (
          <li className="text-sm text-gray-500 text-center py-2">
            Aucun joueur connecté
          </li>
        )}
      </ul>
    </Card>
  );
}
