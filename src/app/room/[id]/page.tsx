"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/contexts/I18nContext";
import { useUser } from "@/contexts/UserContext";
import { isValidRoomId } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Copy, LogOut } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlanningTable } from "../_components/PlanningTable";

type RoomState = {
  players: Array<{
    id: string;
    name: string;
    selectedCard: string | null;
  }>;
  isRevealed: boolean;
  allPlayersVoted: boolean;
  gameId: string | null;
};

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, logout, isLoading, isLoggingOut } = useUser();
  const { t } = useI18n();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isSelectingCard, setIsSelectingCard] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  const hasJoinedRoom = useRef<boolean>(false);
  const lastEventId = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const cardValues = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (id && !isValidRoomId(id)) {
      router.push("/");
      return;
    }
  }, [id, router]);

  useEffect(() => {
    if (!isLoading && !user && !isLoggingOut && id && isValidRoomId(id)) {
      router.push(`/sign-in?room=${id}`);
    }
  }, [id, user, isLoading, isLoggingOut, router]);

  const utils = api.useUtils();

  const joinRoomMutation = api.poker.joinRoom.useMutation({
    onSuccess: () => {
      setConnectionRetries(0);
      toast.success(t("room.joinedSuccessfully"));
      void utils.poker.getRoomState.invalidate({ roomId: id });
    },
    onError: (error) => {
      const errorMessage = error.message ?? t("errors.unknownError");
      toast.error(errorMessage);

      if (errorMessage.includes("Room is full")) {
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        hasJoinedRoom.current = false;

        if (connectionRetries < MAX_RETRIES) {
          setConnectionRetries((prev) => prev + 1);
          setTimeout(
            () => {
              if (!hasJoinedRoom.current && user) {
                hasJoinedRoom.current = true;
                joinRoomMutation.mutate({
                  roomId: id,
                  playerId: user.id,
                  playerName: user.username,
                });
              }
            },
            1000 * Math.pow(2, connectionRetries),
          );
        }
      }
    },
  });

  const selectCardMutation = api.poker.selectCard.useMutation({
    onSuccess: () => {
      void utils.poker.getRoomState.invalidate({ roomId: id });
    },
    onError: (error) => {
      setSelectedCard(null);
      toast.error(error.message ?? t("errors.cardSelectionFailed"));
    },
    onSettled: () => {
      setIsSelectingCard(false);
    },
  });

  const startNewRoundMutation = api.poker.startNewRound.useMutation({
    onSuccess: () => {
      setSelectedCard(null);
      setIsSelectingCard(false);
      toast.success(t("room.newRoundStarted"));
      void utils.poker.getRoomState.invalidate({ roomId: id });
    },
    onError: (error) => {
      toast.error(error.message ?? t("errors.newRoundFailed"));
    },
  });

  const { data: roomState, refetch: refetchRoomState } =
    api.poker.getRoomState.useQuery(
      { roomId: id ?? "" },
      {
        enabled: !!id && !!user && isValidRoomId(id),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount) => {
          if (failureCount < 3) {
            setTimeout(
              () => void refetchRoomState(),
              1000 * Math.pow(2, failureCount),
            );
            return false;
          }
          return false;
        },
      },
    );

  api.poker.onRoomUpdate.useSubscription(
    {
      roomId: id ?? "",
      lastEventId: lastEventId.current,
    },
    {
      enabled: !!id && !!user && isValidRoomId(id),
      onData: (data) => {
        console.log("Room update:", data);
        lastEventId.current = data.id;

        switch (data.data.type) {
          case "newRoundStarted":
            setSelectedCard(null);
            setIsSelectingCard(false);
            void utils.poker.getRoomState.invalidate({ roomId: id });
            break;

          case "cardsRevealed":
            void utils.poker.getRoomState.invalidate({ roomId: id });
            break;

          case "cardSelected":
          case "playerJoined":
          case "roomState":
            void utils.poker.getRoomState.invalidate({ roomId: id });
            break;

          default:
            void utils.poker.getRoomState.invalidate({ roomId: id });
            break;
        }
      },
      onError: (error) => {
        console.error("Subscription error:", error);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect subscription...");
          void utils.poker.getRoomState.invalidate({ roomId: id });
        }, 2000);
      },
    },
  );

  useEffect(() => {
    if (
      user &&
      id &&
      isValidRoomId(id) &&
      !hasJoinedRoom.current &&
      !joinRoomMutation.isPending
    ) {
      hasJoinedRoom.current = true;
      joinRoomMutation.mutate({
        roomId: id,
        playerId: user.id,
        playerName: user.username,
      });
    }
  }, [user?.id, id, joinRoomMutation]);

  useEffect(() => {
    if (
      user &&
      roomState &&
      hasJoinedRoom.current &&
      !joinRoomMutation.isPending &&
      connectionRetries < MAX_RETRIES
    ) {
      const userInRoom = roomState.players.some((p) => p.id === user.id);
      if (!userInRoom) {
        console.log("User not found in room, retrying join...");
        hasJoinedRoom.current = false;
        setConnectionRetries((prev) => prev + 1);

        setTimeout(() => {
          if (!hasJoinedRoom.current && user) {
            hasJoinedRoom.current = true;
            joinRoomMutation.mutate({
              roomId: id,
              playerId: user.id,
              playerName: user.username,
            });
          }
        }, 1000);
      }
    }
  }, [user, roomState, joinRoomMutation, id, connectionRetries]);

  useEffect(() => {
    if (roomState && user) {
      const currentUser = roomState.players.find((p) => p.id === user.id);

      if (!roomState.isRevealed) {
        if (currentUser && !currentUser.selectedCard && selectedCard) {
          setSelectedCard(null);
        }

        if (
          currentUser?.selectedCard &&
          selectedCard !== currentUser.selectedCard
        ) {
          setSelectedCard(currentUser.selectedCard);
        }
      }
    }
  }, [roomState?.isRevealed, roomState?.players, selectedCard, user?.id]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const copyRoomLink = useCallback(() => {
    const roomLink = `${window.location.origin}/room/${id}`;
    navigator.clipboard
      .writeText(roomLink)
      .then(() => {
        toast.success(t("room.linkCopied"));
      })
      .catch(() => {
        toast.error(t("errors.copyFailed"));
      });
  }, [id, t]);

  const handleCardSelect = useCallback(
    (value: string) => {
      if (!user || isSelectingCard || roomState?.isRevealed) {
        return;
      }

      setSelectedCard(value);
      setIsSelectingCard(true);

      selectCardMutation.mutate({
        roomId: id,
        playerId: user.id,
        cardValue: value,
      });
    },
    [user, isSelectingCard, roomState?.isRevealed, selectCardMutation, id],
  );

  const handleStartNewRound = useCallback(() => {
    startNewRoundMutation.mutate({
      roomId: id,
    });
  }, [startNewRoundMutation, id]);

  const handleLogout = useCallback(() => {
    toast.success(t("room.loggedOut"));
    logout();
  }, [logout, t]);

  if (!id || !isValidRoomId(id)) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-60"></div>
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {t("common.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const players = roomState?.players ?? [];
  const currentUser = players.find((p) => p.id === user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-60"></div>

      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-white/20 bg-white/60 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg ring-1 ring-white/20">
                  <span className="text-lg font-bold text-white">PP</span>
                </div>
              </div>

              <span className="mr-8 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text font-semibold text-transparent dark:from-white dark:via-blue-100 dark:to-indigo-100">
                {t("home.title")}
              </span>
              <LanguageSelector />
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {t("common.players")}
                </div>
                <div
                  className={`text-sm font-medium ${
                    players.length >= 10
                      ? "text-red-500"
                      : players.length >= 8
                        ? "text-yellow-500"
                        : "text-green-500"
                  }`}
                >
                  {players.length}/10
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {t("common.roomId")}
                </div>
                <div className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200">
                  {id}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyRoomLink}
                  className="bg-emerald-500 shadow-lg transition-all duration-300 hover:bg-emerald-600 hover:shadow-xl"
                >
                  <Copy size={16} className="mr-1" />
                  {t("common.copy")}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  title={t("common.logout")}
                  className="border-slate-200/50 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:bg-slate-900/80"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex h-full w-full items-center justify-center">
            <PlanningTable
              players={players}
              title={t("room.title")}
              isRevealed={roomState?.isRevealed ?? false}
              onStartNewRound={handleStartNewRound}
              isStartingNewRound={startNewRoundMutation.isPending}
            />
          </div>
        </div>

        <footer className="border-t border-white/20 bg-white/60 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-4 md:px-6 dark:border-slate-700/50 dark:bg-slate-900/60">
          <div className="container mx-auto">
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-center text-xs text-slate-600 sm:mb-2 sm:text-sm dark:text-slate-400">
                {roomState?.isRevealed
                  ? t("room.cardsRevealedFooter")
                  : t("room.availableCards")}
              </p>
              <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-1.5 sm:gap-2">
                {cardValues.map((value) => {
                  const isDisabled =
                    selectCardMutation.isPending ||
                    (roomState?.isRevealed ?? false) ||
                    isSelectingCard;
                  const isSelected =
                    (selectedCard === value ||
                      currentUser?.selectedCard === value) &&
                    !roomState?.isRevealed;

                  return (
                    <button
                      key={value}
                      className="group relative"
                      onClick={() => handleCardSelect(value)}
                      disabled={isDisabled}
                    >
                      <Card
                        className={`group relative flex h-14 w-10 items-center justify-center overflow-hidden border-0 bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-16 sm:w-12 dark:bg-slate-900/70 ${
                          isSelected
                            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent"
                            : ""
                        } ${
                          isDisabled
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        {!isDisabled && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                        )}
                        <CardContent className="relative flex h-full items-center justify-center p-0">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {value}
                          </span>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>

              {players.length >= 8 && (
                <div className="mt-2 text-center">
                  <div className="inline-block rounded-xl border border-slate-200/50 bg-white/60 p-3 shadow-lg backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {t("room.capacityWarning", { current: players.length })}
                      {players.length >= 10 && (
                        <span className="mt-1 block text-yellow-600 dark:text-yellow-400">
                          {t("room.capacityFull").split("{contactLink}")[0]}
                          <a
                            href="mailto:contact@michkoff.com"
                            className="font-medium underline decoration-2 underline-offset-2 transition-colors duration-200 hover:text-yellow-700 hover:decoration-yellow-600 dark:hover:text-yellow-300 dark:hover:decoration-yellow-400"
                          >
                            contact@michkoff.com
                          </a>
                          {t("room.capacityFull").split("{contactLink}")[1]}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Connection status indicator */}
              {connectionRetries > 0 && connectionRetries < MAX_RETRIES && (
                <div className="mt-2 text-center">
                  <div className="inline-block rounded-xl border border-yellow-200/50 bg-yellow-50/60 p-3 shadow-lg backdrop-blur-sm dark:border-yellow-800/50 dark:bg-yellow-950/60">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {t("room.reconnecting")} ({connectionRetries}/
                      {MAX_RETRIES})
                    </p>
                  </div>
                </div>
              )}

              {connectionRetries >= MAX_RETRIES && (
                <div className="mt-2 text-center">
                  <div className="inline-block rounded-xl border border-red-200/50 bg-red-50/60 p-3 shadow-lg backdrop-blur-sm dark:border-red-800/50 dark:bg-red-950/60">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {t("room.connectionFailed")}
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0 text-xs text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                        onClick={() => {
                          setConnectionRetries(0);
                          hasJoinedRoom.current = false;
                        }}
                      >
                        {t("room.retry")}
                      </Button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
