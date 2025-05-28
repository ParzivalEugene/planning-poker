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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const players = roomState?.players ?? [];
  const currentUser = players.find((p) => p.id === user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-card/50 w-full border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-md">
              <span className="text-primary-foreground font-bold">PP</span>
            </div>

            <span className="mr-8 font-semibold">{t("home.title")}</span>
            <LanguageSelector />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-muted-foreground text-xs">
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
              <div className="text-muted-foreground text-xs">
                {t("common.roomId")}
              </div>
              <div className="font-mono text-sm font-medium">{id}</div>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyRoomLink}>
                <Copy size={16} className="mr-1" />
                {t("common.copy")}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                title={t("common.logout")}
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

      <footer className="bg-background border-t px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="container mx-auto">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground mb-1 text-center text-xs sm:mb-2 sm:text-sm">
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
                      className={`group-hover:border-primary flex h-14 w-10 items-center justify-center transition-all hover:scale-110 hover:shadow-md sm:h-16 sm:w-12 ${
                        isSelected
                          ? "border-primary bg-primary/10 border-2"
                          : ""
                      } ${
                        isDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <CardContent className="flex h-full items-center justify-center p-0">
                        <span className="font-bold">{value}</span>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>

            {players.length >= 8 && (
              <div className="mt-2 text-center">
                <p className="text-muted-foreground text-xs">
                  {t("room.capacityWarning", { current: players.length })}
                  {players.length >= 10 && (
                    <span className="mt-1 block text-yellow-600">
                      {t("room.capacityFull").split("{contactLink}")[0]}
                      <a
                        href="mailto:contact@michkoff.com"
                        className="underline hover:text-yellow-500"
                      >
                        contact@michkoff.com
                      </a>
                      {t("room.capacityFull").split("{contactLink}")[1]}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Connection status indicator */}
            {connectionRetries > 0 && connectionRetries < MAX_RETRIES && (
              <div className="mt-2 text-center">
                <p className="text-xs text-yellow-600">
                  {t("room.reconnecting")} ({connectionRetries}/{MAX_RETRIES})
                </p>
              </div>
            )}

            {connectionRetries >= MAX_RETRIES && (
              <div className="mt-2 text-center">
                <p className="text-xs text-red-600">
                  {t("room.connectionFailed")}
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 h-auto p-0 text-xs"
                    onClick={() => {
                      setConnectionRetries(0);
                      hasJoinedRoom.current = false;
                    }}
                  >
                    {t("room.retry")}
                  </Button>
                </p>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
