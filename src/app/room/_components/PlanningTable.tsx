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
    <div className="container-responsive">
      {/* Top row of players - responsive spacing */}
      <div className="gap-responsive-md flex justify-center">
        {topPlayers.map((item, index) => (
          <PlayerCard
            key={`top-${index}`}
            player={item.player}
            position="top"
            isRevealed={isRevealed}
          />
        ))}
      </div>

      {/* Middle section with table and side players - responsive layout */}
      <div className="flex items-center justify-center">
        {/* Left column players - responsive spacing */}
        <div className="spacing-responsive-md mr-1 flex flex-col sm:mr-2 md:mr-4 lg:mr-6 xl:mr-8">
          {leftPlayers.map((item, index) => (
            <PlayerCard
              key={`left-${index}`}
              player={item.player}
              position="left"
              isRevealed={isRevealed}
            />
          ))}
        </div>

        {/* Center table - responsive sizing and content */}
        <div className="w-full max-w-[280px] flex-1 px-1 sm:max-w-[320px] sm:px-2 md:max-w-[380px] md:px-3 lg:max-w-[450px] lg:px-4 xl:max-w-[500px] xl:px-5">
          <div className="group padding-responsive-md relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border-0 bg-white/70 shadow-xl backdrop-blur-sm transition-all duration-300 sm:rounded-2xl dark:bg-slate-900/70">
            {/* Responsive aspect ratio */}
            <div className="aspect-[4/3] w-full sm:aspect-[3/2] md:aspect-[5/3] lg:aspect-[16/9]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300"></div>
              <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
                <h2 className="text-responsive-lg high-dpi-text mb-2 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text font-bold text-transparent sm:mb-3 dark:from-white dark:via-blue-100 dark:to-indigo-100">
                  {title}
                </h2>
                {players.length > 0 && (
                  <div className="text-center">
                    {players.length >= 9 && (
                      <div
                        className={`text-responsive-xs mb-2 font-medium ${players.length >= 10 ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}
                      >
                        {players.length >= 10
                          ? t("room.roomFullStatus")
                          : t("room.almostFullStatus", {
                              current: players.length,
                            })}
                      </div>
                    )}
                    {isRevealed ? (
                      <div className="spacing-responsive-sm">
                        <div className="text-responsive-sm font-medium text-green-600 dark:text-green-400">
                          {t("room.cardsRevealedStatus")}
                        </div>
                        {onStartNewRound && (
                          <Button
                            onClick={onStartNewRound}
                            variant="outline"
                            size="sm"
                            disabled={isStartingNewRound}
                            className="touch-target text-responsive-xs cursor-pointer border-emerald-200 bg-white/50 text-emerald-700 backdrop-blur-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-emerald-800 dark:bg-slate-900/50 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                          >
                            {t("room.startNewRound")}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-responsive-xs text-slate-600 dark:text-slate-300">
                        {t("room.votingStatus", {
                          voted: players.filter((p) => p.selectedCard).length,
                          total: players.length,
                        })}
                        {players.every((p) => p.selectedCard) &&
                          players.length > 0 && (
                            <div className="text-responsive-xs mt-1 font-medium text-blue-600 dark:text-blue-400">
                              {t("room.revealingCards")}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column players - responsive spacing */}
        <div className="spacing-responsive-md ml-1 flex flex-col sm:ml-2 md:ml-4 lg:ml-6 xl:ml-8">
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

      {/* Bottom row of players - responsive spacing */}
      <div className="gap-responsive-md flex justify-center">
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
