"use client";

import { useParams, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, LogOut } from "lucide-react";
import { PlanningTable } from "../_components/PlanningTable";
import { type Player } from "../_components/types";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { useState } from "react";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useUser();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Room ID will be used for real-time connection in a production app
  console.log("Room ID:", id);

  const cardValues = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];

  // Sample player data - in a real app this would come from a database or API
  const players: Player[] = [
    { id: "1", name: "John Doe", selectedCard: "5" },
    { id: "2", name: "Alice Miller", selectedCard: null },
    { id: "3", name: "Robert Knight", selectedCard: "8" },
    { id: "4", name: "Emily Chen", selectedCard: "3" },
    { id: "5", name: "David Smith", selectedCard: "13" },
    { id: "6", name: "Lisa Wang", selectedCard: null },
    { id: "7", name: "Michael Brown", selectedCard: "2" },
  ];

  // Add the current user to the players list if they're not already there
  const currentUserInGame = user
    ? players.some((player) => player.id === user.id)
    : false;

  const playersWithCurrentUser =
    !currentUserInGame && user
      ? [...players, { id: user.id, name: user.username, selectedCard }]
      : players;

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/room/${id}`;
    navigator.clipboard.writeText(roomLink);
    toast.success("Room link copied to clipboard");
  };

  const handleCardSelect = (value: string) => {
    setSelectedCard(value);
    toast.success(`You selected card: ${value}`);
    // In a real app, you would send this to the server
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-card/50 w-full border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-md">
              <span className="text-primary-foreground font-bold">PP</span>
            </div>
            <span className="font-semibold">Planning Poker</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="mr-2 text-sm">
                Logged in as:{" "}
                <span className="font-medium">{user.username}</span>
              </div>
            )}
            <div className="flex -space-x-2">
              {playersWithCurrentUser.slice(0, 3).map((player, index) => (
                <div
                  key={player.id}
                  className={`border-background flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    ["bg-blue-500", "bg-green-500", "bg-yellow-500"][index % 3]
                  } text-xs font-medium text-white`}
                >
                  {player.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
              ))}
              {playersWithCurrentUser.length > 3 && (
                <div className="bg-background border-background text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium">
                  +{playersWithCurrentUser.length - 3}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={copyRoomLink}>
                <Copy size={16} className="mr-1" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex h-full w-full items-center justify-center">
          {/* Use the updated PlanningTable component with players array */}
          <PlanningTable
            players={playersWithCurrentUser}
            title="Planning Poker Session"
          />
        </div>
      </div>

      <footer className="bg-background border-t px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="container mx-auto">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground mb-1 text-center text-xs sm:mb-2 sm:text-sm">
              Available Cards:
            </p>
            <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-1.5 sm:gap-2">
              {cardValues.map((value) => (
                <button
                  key={value}
                  className="group relative"
                  onClick={() => handleCardSelect(value)}
                >
                  <Card
                    className={`group-hover:border-primary flex h-14 w-10 items-center justify-center transition-all hover:scale-110 hover:shadow-md sm:h-16 sm:w-12 ${
                      selectedCard === value
                        ? "border-primary bg-primary/10 border-2"
                        : ""
                    }`}
                  >
                    <CardContent className="flex h-full items-center justify-center p-0">
                      <span className="font-bold">{value}</span>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
