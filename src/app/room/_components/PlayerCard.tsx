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
        className={`xs:h-22 xs:w-16 group relative mb-2 flex h-20 w-14 items-center justify-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-24 sm:w-18 ${
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
            <span className="xs:text-2xl text-xl font-bold text-slate-800 sm:text-3xl dark:text-slate-200">
              {player.selectedCard}
            </span>
          )}
          {!isEmpty && player?.selectedCard && !isRevealed && (
            <span className="text-3xl">✅</span>
          )}
          {!isEmpty && !player?.selectedCard && (
            <span className="text-3xl">🤔</span>
          )}
        </CardContent>
      </Card>

      <span
        className={`text-xs font-medium sm:text-sm ${
          isEmpty
            ? "text-slate-500 dark:text-slate-400"
            : "text-slate-700 dark:text-slate-300"
        } max-w-[80px] truncate`}
      >
        {isEmpty ? t("room.emptySeat") : player.name}
      </span>
    </div>
  );
}
