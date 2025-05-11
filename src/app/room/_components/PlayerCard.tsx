import { Card, CardContent } from "@/components/ui/card";
import { type Player, type PlayerPosition } from "./types";

type PlayerCardProps = {
  player?: Player;
  className?: string;
  position?: PlayerPosition;
};

export function PlayerCard({ player, className, position }: PlayerCardProps) {
  const isEmpty = !player;

  // Define special styling based on position for better alignment
  const positionClasses = {
    top: "mb-3 sm:mb-4 md:mb-6",
    bottom: "mt-3 sm:mt-4 md:mt-6",
    left: "mr-2 sm:mr-3 md:mr-4 lg:mr-3",
    right: "ml-2 sm:ml-3 md:ml-4 lg:ml-3",
  };

  return (
    <div
      className={`flex flex-col items-center ${position ? positionClasses[position] : ""} ${className}`}
    >
      <Card
        className={`xs:h-22 xs:w-16 mb-2 flex h-20 w-14 items-center justify-center transition-transform hover:scale-105 sm:h-24 sm:w-18 ${isEmpty ? "border-muted bg-muted/5 border-2 border-dashed" : ""} `}
      >
        <CardContent className="flex h-full items-center justify-center p-0">
          {!isEmpty && player?.selectedCard && (
            <span className="xs:text-2xl text-xl font-bold sm:text-3xl">
              {player.selectedCard}
            </span>
          )}
          {!isEmpty && !player?.selectedCard && (
            <span className="text-muted-foreground text-xs">Thinking...</span>
          )}
        </CardContent>
      </Card>

      <span
        className={`text-xs font-medium sm:text-sm ${isEmpty ? "text-muted-foreground" : ""} max-w-[80px] truncate`}
      >
        {isEmpty ? "Empty seat" : player.name}
      </span>
    </div>
  );
}
