"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/contexts";
import { useSaluteAssistant } from "@/hooks/useSaluteAssistant";
import { isValidRoomId } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Copy, LogOut } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlanningTable } from "../_components/PlanningTable";

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, logout, isLoading, isLoggingOut } = useUser();
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
      toast.success("Успешно присоединились к комнате");
      void utils.poker.getRoomState.invalidate({ roomId: id });
    },
    onError: (error) => {
      const errorMessage = "Неизвестная ошибка";
      toast.error(errorMessage);

      if (errorMessage.includes("заполнена")) {
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
      toast.error("Не удалось выбрать карту");
    },
    onSettled: () => {
      setIsSelectingCard(false);
    },
  });

  const startNewRoundMutation = api.poker.startNewRound.useMutation({
    onSuccess: () => {
      setSelectedCard(null);
      setIsSelectingCard(false);
      void utils.poker.getRoomState.invalidate({ roomId: id });
    },
    onError: (error) => {
      toast.error("Не удалось начать новый раунд");
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

  const handleCardSelect = (value: string) => {
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
  };

  const handleStartNewRound = () => {
    startNewRoundMutation.mutate({
      roomId: id,
    });
  };

  const handleLogout = useCallback(() => {
    toast.success("Успешно вышли из системы");
    logout();
  }, [logout]);

  useSaluteAssistant({
    roomState: {
      players: roomState?.players ?? [],
      isRevealed: roomState?.isRevealed ?? false,
      allPlayersVoted: roomState?.allPlayersVoted ?? false,
      gameId: roomState?.gameId ?? null,
    },
    currentPlayerId: user?.id ?? "",
    onSelectCard: handleCardSelect,
    onStartNewRound: handleStartNewRound,
  });

  api.poker.onRoomUpdate.useSubscription(
    {
      roomId: id ?? "",
      lastEventId: lastEventId.current,
    },
    {
      enabled: !!id && !!user && isValidRoomId(id),
      onData: (data) => {
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
        toast.success("Ссылка на комнату скопирована в буфер обмена");
      })
      .catch(() => {
        toast.error("Не удалось скопировать ссылку в буфер обмена");
      });
  }, [id]);

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
              Загрузка...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const players = roomState?.players ?? [];
  const currentUser = players.find((p) => p.id === user.id);
  return (
    <div className="mobile-landscape-compact h-[calc(100vh-140px)] overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 md:h-[calc(100vh-110px)] dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-60"></div>

      <div className="relative flex h-full flex-col">
        {/* Header - Responsive */}
        <header className="border-b border-white/20 bg-white/60 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
          <div className="container-responsive flex h-12 items-center justify-between sm:h-14 md:h-16">
            {/* Left section - Logo and title */}
            <div className="gap-responsive-sm flex items-center">
              <Link href="/">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg ring-1 ring-white/20 sm:h-10 sm:w-10 sm:rounded-xl">
                    <span className="text-responsive-sm font-bold text-white">
                      PP
                    </span>
                  </div>
                </div>
              </Link>

              {/* Title - hidden on mobile */}
              <span className="text-responsive-sm hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text font-semibold text-transparent md:block dark:from-white dark:via-blue-100 dark:to-indigo-100">
                Planning Poker
              </span>
            </div>

            {/* Right section - Stats and actions */}
            <div className="gap-responsive-sm flex items-center">
              {/* Mobile: Only show player count and actions */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="text-center">
                  <div
                    className={`text-xs font-medium ${
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
              </div>

              {/* Desktop: Show full stats */}
              <div className="hidden flex-col gap-1 text-center md:flex md:flex-row md:gap-4">
                <div className="text-center">
                  <div className="text-responsive-xs text-slate-600 dark:text-slate-400">
                    Игроки
                  </div>
                  <div
                    className={`text-responsive-xs font-medium ${
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
                  <div className="text-responsive-xs text-slate-600 dark:text-slate-400">
                    ID комнаты
                  </div>
                  <div className="text-responsive-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                    {id}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1 sm:gap-2">
                <Button
                  onClick={copyRoomLink}
                  size="sm"
                  className="touch-target bg-emerald-500 px-2 text-xs shadow-lg transition-all duration-300 hover:bg-emerald-600 hover:shadow-xl sm:px-4 sm:text-sm"
                >
                  <Copy size={14} className="sm:mr-2" />
                  <span className="hidden sm:inline">Ссылка</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  title="Выйти"
                  className="touch-target border-slate-200/50 bg-white/50 px-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-lg sm:px-3 dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:bg-slate-900/80"
                >
                  <LogOut size={14} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="padding-responsive-sm planning-table flex min-h-0 flex-1 items-center justify-center">
          <div className="mx-auto flex h-full w-full items-center justify-center">
            <PlanningTable
              players={players}
              title="Planning Poker"
              isRevealed={roomState?.isRevealed ?? false}
              onStartNewRound={handleStartNewRound}
              isStartingNewRound={startNewRoundMutation.isPending}
            />
          </div>
        </div>

        {/* Footer - Responsive card selection with salute assistant padding */}
        <footer className="card-selection flex-shrink-0 border-t border-white/20 bg-white/60 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
          <div className="container-responsive flex flex-col justify-center px-2 py-2 sm:px-4">
            <div className="flex flex-col gap-1 sm:gap-2">
              {/* Mobile info bar - Room ID */}
              <div className="flex items-center justify-center md:hidden">
                <div className="text-center">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Комната:{" "}
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {id}
                    </span>
                  </div>
                </div>
              </div>

              <p className="hidden text-center text-xs text-slate-600 sm:block dark:text-slate-400">
                {roomState?.isRevealed
                  ? "Карты раскрыты - Начните новый раунд для повторного голосования"
                  : "Доступные карты:"}
              </p>
              <div className="mx-auto flex max-w-full flex-wrap justify-center gap-1 sm:max-w-4xl sm:gap-2">
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
                      className="group touch-target relative"
                      onClick={() => handleCardSelect(value)}
                      disabled={isDisabled}
                    >
                      <Card
                        className={`group relative flex h-10 w-6 items-center justify-center overflow-hidden border-0 bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-12 sm:w-8 md:h-13 md:w-9 dark:bg-slate-900/70 ${
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
                          <span className="high-dpi-text text-xs font-bold text-slate-800 sm:text-sm dark:text-slate-200">
                            {value}
                          </span>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>

              {players.length >= 8 && (
                <div className="mt-1 text-center">
                  <div className="inline-block rounded border border-slate-200/50 bg-white/60 p-1 shadow backdrop-blur-sm sm:rounded-lg sm:p-2 dark:border-slate-700/50 dark:bg-slate-900/60">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Вместимость комнаты: {players.length}/10 игроков
                      {players.length >= 10 && (
                        <span className="mt-1 block text-yellow-600 dark:text-yellow-400">
                          Нужна большая вместимость? Свяжитесь с{" "}
                          <a
                            href="mailto:contact@michkoff.com"
                            className="font-medium underline decoration-2 underline-offset-2 transition-colors duration-200 hover:text-yellow-700 hover:decoration-yellow-600 dark:hover:text-yellow-300 dark:hover:decoration-yellow-400"
                          >
                            contact@michkoff.com
                          </a>{" "}
                          для обсуждения партнерских возможностей 💰
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {connectionRetries > 0 && connectionRetries < MAX_RETRIES && (
                <div className="mt-1 text-center">
                  <div className="inline-block rounded border border-yellow-200/50 bg-yellow-50/60 p-1 shadow backdrop-blur-sm sm:rounded-lg sm:p-2 dark:border-yellow-800/50 dark:bg-yellow-950/60">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Переподключение ({connectionRetries}/{MAX_RETRIES})
                    </p>
                  </div>
                </div>
              )}

              {connectionRetries >= MAX_RETRIES && (
                <div className="mt-1 text-center">
                  <div className="inline-block rounded border border-red-200/50 bg-red-50/60 p-1 shadow backdrop-blur-sm sm:rounded-lg sm:p-2 dark:border-red-800/50 dark:bg-red-950/60">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Ошибка подключения
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0 text-xs text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                        onClick={() => {
                          setConnectionRetries(0);
                          hasJoinedRoom.current = false;
                        }}
                      >
                        Повторить
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
