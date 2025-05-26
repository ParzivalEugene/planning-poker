"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { PlayerCard } from "./PlayerCard";
import { type Player, type PlayerPosition } from "./types";

export type PlanningTableProps = {
  players: Player[];
  title?: string;
  isRevealed?: boolean;
  onStartNewRound?: () => void;
  isStartingNewRound?: boolean;
};

export function PlanningTable({
  players,
  title = "Planning Area",
  isRevealed = false,
  onStartNewRound,
  isStartingNewRound = false,
}: PlanningTableProps) {
  const { t } = useI18n();
  // Define the table grid layout - 5 columns and 4 rows
  const gridLayout = [
    // Top row - positions 2-1, 3-1, 4-1
    { col: 2, row: 1 },
    { col: 3, row: 1 },
    { col: 4, row: 1 },

    // Left side - positions 1-2, 1-3
    { col: 1, row: 2 },
    { col: 1, row: 3 },

    // Right side - positions 5-2, 5-3
    { col: 5, row: 2 },
    { col: 5, row: 3 },

    // Bottom row - positions 2-4, 3-4, 4-4
    { col: 2, row: 4 },
    { col: 3, row: 4 },
    { col: 4, row: 4 },
  ];

  // Define the type for assigned players
  type AssignedPlayer = {
    position: { col: number; row: number };
    player: Player | undefined;
    positionType: PlayerPosition;
  };

  // Assign players to positions
  const assignedPlayers: AssignedPlayer[] = gridLayout.map(
    (position, index) => {
      const player = index < players.length ? players[index] : undefined;
      return {
        position,
        player,
        positionType: getPositionType(position),
      };
    },
  );

  // Get the position type (top, bottom, left, right) based on the grid position
  function getPositionType(position: {
    col: number;
    row: number;
  }): PlayerPosition {
    if (position.row === 1) return "top";
    if (position.row === 4) return "bottom";
    if (position.col === 1) return "left";
    if (position.col === 5) return "right";
    return "top"; // Fallback, shouldn't happen with our grid
  }

  // Group players by position for rendering
  const topPlayers = assignedPlayers.filter((p) => p.positionType === "top");
  const leftPlayers = assignedPlayers.filter((p) => p.positionType === "left");
  const rightPlayers = assignedPlayers.filter(
    (p) => p.positionType === "right",
  );
  const bottomPlayers = assignedPlayers.filter(
    (p) => p.positionType === "bottom",
  );

  return (
    <div className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] 2xl:max-w-[50vw]">
      {/* Top row of players */}
      <div className="flex justify-center gap-3 sm:gap-6 md:gap-8 lg:gap-10">
        {topPlayers.map((item, index) => (
          <PlayerCard
            key={`top-${index}`}
            player={item.player}
            position="top"
            isRevealed={isRevealed}
          />
        ))}
      </div>

      {/* Middle section with table and side players */}
      <div className="flex items-center justify-center">
        {/* Left column players */}
        <div className="mr-2 flex flex-col space-y-4 sm:mr-4 md:mr-6 md:space-y-8 lg:mr-5 lg:space-y-12">
          {leftPlayers.map((item, index) => (
            <PlayerCard
              key={`left-${index}`}
              player={item.player}
              position="left"
              isRevealed={isRevealed}
            />
          ))}
        </div>

        {/* Center table - constrained to not take over the screen */}
        <div className="w-full max-w-[380px] flex-1 px-2 sm:px-3 md:px-4 lg:max-w-[450px] lg:px-5 xl:max-w-[500px]">
          <div className="bg-card z-10 mx-auto flex aspect-[3/2] w-full flex-col items-center justify-center rounded-xl border p-4 shadow-lg sm:aspect-[4/3] md:aspect-[5/3]">
            <h2 className="text-card-foreground mb-2 text-lg font-bold sm:text-xl md:text-2xl">
              {title}
            </h2>
            {players.length > 0 && (
              <div className="text-center">
                {players.length >= 9 && (
                  <div
                    className={`mb-2 text-xs font-medium ${players.length >= 10 ? "text-red-600" : "text-yellow-600"}`}
                  >
                    {players.length >= 10
                      ? t("room.roomFullStatus")
                      : t("room.almostFullStatus", { current: players.length })}
                  </div>
                )}
                {isRevealed ? (
                  <div className="space-y-3">
                    <div className="font-medium text-green-600">
                      {t("room.cardsRevealedStatus")}
                    </div>
                    {onStartNewRound && (
                      <Button
                        onClick={onStartNewRound}
                        variant="outline"
                        disabled={isStartingNewRound}
                        size="sm"
                      >
                        {t("room.startNewRound")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    {t("room.votingStatus", {
                      voted: players.filter((p) => p.selectedCard).length,
                      total: players.length,
                    })}
                    {players.every((p) => p.selectedCard) &&
                      players.length > 0 && (
                        <div className="mt-1 font-medium text-blue-600">
                          {t("room.revealingCards")}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column players */}
        <div className="ml-2 flex flex-col space-y-4 sm:ml-4 md:ml-6 md:space-y-8 lg:ml-5 lg:space-y-12">
          {rightPlayers.map((item, index) => (
            <PlayerCard
              key={`right-${index}`}
              player={item.player}
              position="right"
              isRevealed={isRevealed}
            />
          ))}
        </div>
      </div>

      {/* Bottom row of players */}
      <div className="flex justify-center gap-3 sm:gap-6 md:gap-8 lg:gap-10">
        {bottomPlayers.map((item, index) => (
          <PlayerCard
            key={`bottom-${index}`}
            player={item.player}
            position="bottom"
            isRevealed={isRevealed}
          />
        ))}
      </div>
    </div>
  );
}
