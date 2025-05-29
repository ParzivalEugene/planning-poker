"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/contexts/I18nContext";
import { type Player, type PlayerPosition } from "./types";

type PlayerCardProps = {
  player?: Player;
  className?: string;
  position?: PlayerPosition;
  isRevealed?: boolean;
};

export function PlayerCard({
  player,
  className,
  position,
  isRevealed = false,
}: PlayerCardProps) {
  const { t } = useI18n();
  const isEmpty = !player;

  // Define special styling based on position for better alignment - responsive
  const positionClasses = {
    top: "mb-2 sm:mb-3 md:mb-4 lg:mb-6",
    bottom: "mt-2 sm:mt-3 md:mt-4 lg:mt-6",
    left: "mr-1 sm:mr-2 md:mr-3 lg:mr-4",
    right: "ml-1 sm:ml-2 md:ml-3 lg:ml-4",
  };

  return (
    <div
      className={`flex flex-col items-center ${position ? positionClasses[position] : ""} ${className}`}
    >
      <Card
        className={`group touch-target relative mb-1 flex items-center justify-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:mb-2 ${
          // Responsive card sizes - mobile to desktop with better touch targets
          "h-16 w-12 sm:h-18 sm:w-14 md:h-20 md:w-16 lg:h-22 lg:w-18 xl:h-24 xl:w-20"
        } ${
          isEmpty
            ? "border-0 border-dashed bg-white/30 shadow-lg backdrop-blur-sm dark:bg-slate-900/30"
            : "border-0 bg-white/70 shadow-xl backdrop-blur-sm dark:bg-slate-900/70"
        }`}
      >
        {!isEmpty && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
        )}
        <CardContent className="relative flex h-full items-center justify-center p-0">
          {!isEmpty && player?.selectedCard && isRevealed && (
            <span className="text-responsive-lg high-dpi-text font-bold text-slate-800 dark:text-slate-200">
              {player.selectedCard}
            </span>
          )}
          {!isEmpty && player?.selectedCard && !isRevealed && (
            <span className="text-responsive-xl">✅</span>
          )}
          {!isEmpty && !player?.selectedCard && (
            <span className="text-responsive-xl">🤔</span>
          )}
        </CardContent>
      </Card>

      <span
        className={`text-responsive-xs font-medium ${
          isEmpty
            ? "text-slate-500 dark:text-slate-400"
            : "text-slate-700 dark:text-slate-300"
        } high-dpi-text max-w-[60px] truncate text-center sm:max-w-[70px] md:max-w-[80px] lg:max-w-[90px]`}
      >
        {isEmpty ? t("room.emptySeat") : player.name}
      </span>
    </div>
  );
}
