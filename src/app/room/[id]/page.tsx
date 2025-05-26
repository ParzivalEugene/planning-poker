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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlanningTable } from "../_components/PlanningTable";

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, logout, isLoading } = useUser();
  const { t } = useI18n();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isSelectingCard, setIsSelectingCard] = useState(false);

  const hasJoinedRoom = useRef(false);

  const cardValues = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];

  // Validate room ID format
  useEffect(() => {
    if (id && !isValidRoomId(id)) {
      router.push("/");
      return;
    }
  }, [id, router]);

  // Redirect to sign-in if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user && id && isValidRoomId(id)) {
      router.push(`/sign-in?room=${id}`);
    }
  }, [id, user, isLoading, router]);

  // Join room mutation
  const joinRoomMutation = api.poker.joinRoom.useMutation({
    onSuccess: (data) => {
      // Immediately update the cache with the returned player data
      utils.poker.getRoomState.setData({ roomId: id }, (oldData) => ({
        players: data.players,
        isRevealed: oldData?.isRevealed ?? false,
        allPlayersVoted: oldData?.allPlayersVoted ?? false,
      }));
    },
    onError: (error) => {
      const errorMessage = error.message ?? t("errors.unknownError");

      if (errorMessage.includes("Room is full")) {
        // Special handling for room full error - redirect to home page
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        // Reset the join flag so user can try again
        hasJoinedRoom.current = false;
      }
    },
  });

  // Select card mutation
  const selectCardMutation = api.poker.selectCard.useMutation({
    onSuccess: () => {
      // Invalidate room state to ensure UI updates
      void utils.poker.getRoomState.invalidate({ roomId: id });
    },
    onError: (error) => {
      // Reset selected card on error
      setSelectedCard(null);
    },
    onSettled: () => {
      // Reset selecting state when mutation completes (success or error)
      setIsSelectingCard(false);
    },
  });

  // Start new round mutation
  const utils = api.useUtils();
  const startNewRoundMutation = api.poker.startNewRound.useMutation({
    onSuccess: () => {
      // Reset local state immediately
      setSelectedCard(null);
      setIsSelectingCard(false);

      // The subscription will handle the cache update, but we can also
      // optimistically update the cache here for immediate feedback
      utils.poker.getRoomState.setData({ roomId: id }, (oldData) =>
        oldData
          ? {
              ...oldData,
              isRevealed: false,
              allPlayersVoted: false,
              players: oldData.players.map((p) => ({
                ...p,
                selectedCard: null,
              })),
            }
          : undefined,
      );
    },
    onError: (error) => {
      // Silent error handling
    },
  });

  // Get room state query
  const { data: roomState, refetch: refetchRoomState } =
    api.poker.getRoomState.useQuery(
      { roomId: id ?? "" },
      {
        enabled: !!id && !!user && isValidRoomId(id),
        // No polling needed since we have real-time subscriptions
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    );

  // Subscribe to room updates
  api.poker.onRoomUpdate.useSubscription(
    { roomId: id ?? "" },
    {
      enabled: !!id && !!user && isValidRoomId(id),
      onData: (data) => {
        console.log("Room update:", data);

        // Handle different event types with proper state management
        switch (data.data.type) {
          case "newRoundStarted":
            // Reset selected card immediately
            setSelectedCard(null);
            setIsSelectingCard(false);

            // Update cache with new round state
            utils.poker.getRoomState.setData(
              { roomId: id },
              {
                players: data.data.players,
                isRevealed: false,
                allPlayersVoted: false,
              },
            );
            break;

          case "cardsRevealed":
            // Update cache with revealed state
            if ("isRevealed" in data.data && "allPlayersVoted" in data.data) {
              utils.poker.getRoomState.setData(
                { roomId: id },
                {
                  players: data.data.players,
                  isRevealed: data.data.isRevealed ?? true,
                  allPlayersVoted: data.data.allPlayersVoted ?? true,
                },
              );
            } else {
              // Fallback to invalidate if event doesn't have complete state
              void utils.poker.getRoomState.invalidate({ roomId: id });
            }
            break;

          case "cardSelected":
          case "playerJoined":
            // For these events, just invalidate to trigger a refetch
            void utils.poker.getRoomState.invalidate({ roomId: id });
            break;

          default:
            // For unknown events, invalidate to be safe
            void utils.poker.getRoomState.invalidate({ roomId: id });
            break;
        }
      },
      onError: (error) => {
        console.error("Subscription error:", error);
      },
    },
  );

  // Join room when user logs in and room ID is valid
  useEffect(() => {
    if (user && id && isValidRoomId(id) && !hasJoinedRoom.current) {
      hasJoinedRoom.current = true;
      joinRoomMutation.mutate({
        roomId: id,
        playerId: user.id,
        playerName: user.username,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  // Check if user appears in room after joining, retry if not
  useEffect(() => {
    if (
      user &&
      roomState &&
      hasJoinedRoom.current &&
      !joinRoomMutation.isPending
    ) {
      const userInRoom = roomState.players.some((p) => p.id === user.id);
      if (!userInRoom) {
        console.log("User not found in room, retrying join...");
        // Reset and retry joining
        hasJoinedRoom.current = false;
        setTimeout(() => {
          if (!hasJoinedRoom.current) {
            hasJoinedRoom.current = true;
            joinRoomMutation.mutate({
              roomId: id,
              playerId: user.id,
              playerName: user.username,
            });
          }
        }, 1000); // Wait 1 second before retrying
      }
    }
  }, [user, roomState, joinRoomMutation, id]);

  // Reset selected card when starting a new round or when user has no vote
  useEffect(() => {
    if (roomState && !roomState.isRevealed) {
      // Check if the current user has no vote in the current round
      const currentUser = roomState.players.find((p) => p.id === user?.id);
      if (currentUser && !currentUser.selectedCard && selectedCard) {
        // User had a selected card but doesn't have a vote in current round
        // This means a new round started
        setSelectedCard(null);
      }
    }
  }, [roomState?.isRevealed, roomState?.players, selectedCard, user?.id]);

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/room/${id}`;
    navigator.clipboard.writeText(roomLink).catch(() => {
      // Silent error handling
    });
  };

  const handleCardSelect = (value: string) => {
    if (!user) {
      return;
    }

    // Prevent rapid clicking
    if (isSelectingCard) {
      return;
    }

    // Check if cards are revealed - use the most up-to-date state
    if (roomState?.isRevealed) {
      return;
    }

    // Optimistically update the selected card and set selecting state
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

  const handleLogout = () => {
    toast.success(t("room.loggedOut"));
    logout();
  };

  // Show loading or redirect if not authenticated
  if (!id || !isValidRoomId(id)) {
    return null; // Will redirect
  }

  // Show nothing for non-authenticated users (will redirect to sign-in)
  if (!user) {
    return null;
  }

  // Show loading state while user context is still loading
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
                className={`text-sm font-medium ${players.length >= 10 ? "text-red-500" : players.length >= 8 ? "text-yellow-500" : "text-green-500"}`}
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
                  selectedCard === value && !roomState?.isRevealed;

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
                      } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
