"use client";

import { env } from "@/env";
import { createAssistant, createSmartappDebugger } from "@salutejs/client";
import { useEffect, useRef } from "react";

type Player = {
  id: string;
  name: string;
  selectedCard: string | null;
};

type RoomState = {
  players: Player[];
  isRevealed: boolean;
  allPlayersVoted: boolean;
  gameId: string | null;
};

type AssistantAction = {
  type: "select_card" | "start_new_round";
  cardValue?: string;
};

type UseSaluteAssistantProps = {
  roomState: RoomState;
  currentPlayerId: string;
  onSelectCard: (cardValue: string) => void;
  onStartNewRound: () => void;
};

type AssistantAppState = {
  [key: string]: unknown;
  item_selector?: {
    ignored_words?: string[];
    items: Array<{
      number?: number;
      id?: string;
      title?: string;
      aliases?: string[];
      [key: string]: unknown;
    }>;
  };
};

type AssistantEvent = {
  type?: string;
  character?: { id: string };
  action?: AssistantAction;
};

type AssistantInstance = {
  on: (event: string, handler: (data: AssistantEvent) => void) => void;
  sendData: (data: {
    action: { action_id: string; parameters: unknown };
  }) => void;
  destroy?: () => void;
};

const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];

const initializeAssistant = (
  getState: () => AssistantAppState,
): AssistantInstance => {
  if (process.env.NODE_ENV === "development") {
    return createSmartappDebugger({
      token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJqdGkiOiI0ZWMwZDM4Zi0xZDY1LTQ2MTYtOTgwYi00YzRkZTI3NDdlNzEiLCJzdWIiOiJmZjAwMTBhMmE2ZTYyZjUzNjcyMTgxODVjMzlmMWQyZjQ2YThlZTAwNjNlYTY4YjQ5ZDI0ZjdhMmIxMjc4OGZiOTg4M2IiLCJpc3MiOiJLRVlNQVNURVIiLCJleHAiOjE3NDg2ODI1NDMsImF1ZCI6IlZQUyIsInVzciI6IjAyNDU2ZjEzLWMxMmEtNGNlOC05OGY1LWJjYWNmYjg3OTQ1OSIsImlhdCI6MTc0ODU5NjEzMywic2lkIjoiYTE3YjFjYzItYmVhOC00MWJjLWJlY2EtYjViOWQ5ODM4MmU2In0.nLenlPvBByCf0OS1aW7DLp2hg1NfVv6BAi0-CNWtoo6idBcfnZqwcAKjuymCL438Gm9mm_7bwlMOgijKofl1ocndbsWHdHtvYL8EUY_XppXatUYkEiPeXXytHc7EcJY6i4FECI2zea7ueXeye_I9EAog-naMe5H7n1EAOZNuBOqk1ec6MSSVCM3mGXewlmqv7IZTxfPAeGzy9JZytGy6w3dmwPowK_MdOAkAgLO-vz44FALAYK9Vkx8FcX96gsJ9hiZ6_BYbD8JRjqvDGX3XTZtCLgitAf_NT3tDb8JS7JymNCPK8nV-vLk211DMz02FdRXEF-HaI403KDi1SnQ5Ev_1HxC0SFkd80ge6yOGXAtTITSkozkA1lxVDZBGMu0AJ0NN5jzPkeM6LFMdEswnkx85kSrwhfDEN4cSJ0ExzeUOVQ3SJGKObJkofZUsOjHoFaMELDwanD3dgwcANso0w3tWW0ZDAXsJupZdUB6TvQNVObnc12PcIzyKfYWRP1CL0oDpVd2GLJmEWbYXSWpjRplpD-737TP_NI2sBMY1hsjuwuZwRBveHQUgSm4RgIPu0GXQnS5_mkP-W0pqmPdxMceKr2pHSvNM8SVcjZvPmVVQ89U0-7YpF_y-1VUhWLk5q52AI5I1xadAlCxM8S9QBKELpHF3uoEJzIrtncT7CHM",
      initPhrase: "Запусти Test Planning Poker",
      getState,
      nativePanel: {
        defaultText: "выбери 3",
        screenshotMode: false,
        tabIndex: -1,
      },
    }) as AssistantInstance;
  } else {
    return createAssistant({ getState }) as AssistantInstance;
  }
};

export function useSaluteAssistant({
  roomState,
  currentPlayerId,
  onSelectCard,
  onStartNewRound,
}: UseSaluteAssistantProps) {
  const assistantRef = useRef<AssistantInstance | null>(null);

  const getStateForAssistant = (): AssistantAppState => {
    const currentPlayer = roomState.players.find(
      (p) => p.id === currentPlayerId,
    );
    const canSelectCard = !roomState.isRevealed && roomState.gameId;
    const canStartNewRound = roomState.isRevealed && roomState.allPlayersVoted;

    return {
      poker_planning: {
        current_player: {
          id: currentPlayerId,
          selected_card: currentPlayer?.selectedCard ?? null,
        },
        room_state: {
          is_revealed: roomState.isRevealed,
          all_players_voted: roomState.allPlayersVoted,
          players_count: roomState.players.length,
          voted_count: roomState.players.filter((p) => p.selectedCard).length,
        },
        available_actions: {
          can_select_card: canSelectCard,
          can_start_new_round: canStartNewRound,
        },
        available_cards: CARD_VALUES,
      },
      item_selector: {
        ignored_words: ["выбери", "поставь", "возьми", "начни", "следующий"],
        items: [
          ...CARD_VALUES.map((card, index) => ({
            number: index + 1,
            id: `card_${card}`,
            title: `карту ${card}`,
            aliases: [`карта ${card}`, `${card}`],
            action: { type: "select_card", cardValue: card },
          })),
          {
            number: CARD_VALUES.length + 1,
            id: "new_round",
            title: "новый раунд",
            aliases: ["следующий раунд", "начать сначала", "новая игра"],
            action: { type: "start_new_round" },
          },
        ],
      },
    };
  };

  const dispatchAssistantAction = (action: AssistantAction) => {
    console.log("Poker Planning Assistant Action:", action);

    switch (action.type) {
      case "select_card":
        if (action.cardValue && CARD_VALUES.includes(action.cardValue)) {
          if (!roomState.isRevealed && roomState.gameId) {
            onSelectCard(action.cardValue);
          }
        }
        break;

      case "start_new_round":
        if (roomState.isRevealed && roomState.allPlayersVoted) {
          onStartNewRound();
        }
        break;
    }
  };

  useEffect(() => {
    if (!env.NEXT_PUBLIC_SALUTE_TOKEN || !env.NEXT_PUBLIC_SALUTE_SMARTAPP) {
      console.warn("Salute credentials not found in environment variables");
      return;
    }

    try {
      assistantRef.current = initializeAssistant(getStateForAssistant);

      assistantRef.current.on("data", (event: AssistantEvent) => {
        console.log("Salute Assistant Data:", event);

        if (event.type === "character") {
          console.log("Character event:", event.character?.id);
        } else if (event.type === "insets") {
          console.log("Insets event");
        } else if (event.action) {
          dispatchAssistantAction(event.action);
        }
      });

      assistantRef.current.on("start", (event: AssistantEvent) => {
        console.log("Salute Assistant Started:", event);
      });

      assistantRef.current.on("command", (event: AssistantEvent) => {
        console.log("Salute Assistant Command:", event);
      });

      assistantRef.current.on("error", (event: AssistantEvent) => {
        console.error("Salute Assistant Error:", event);
      });
    } catch (error) {
      console.error("Failed to initialize Salute Assistant:", error);
    }

    return () => {
      if (assistantRef.current) {
        try {
          assistantRef.current.destroy?.();
        } catch (error) {
          console.error("Error destroying assistant:", error);
        }
      }
    };
  }, []);

  // Update assistant state when room state changes
  useEffect(() => {
    if (assistantRef.current) {
      try {
        assistantRef.current.sendData({
          action: {
            action_id: "room_state_update",
            parameters: getStateForAssistant(),
          },
        });
      } catch (error) {
        console.error("Error updating assistant state:", error);
      }
    }
  }, [roomState, currentPlayerId]);

  return {
    isActive: !!assistantRef.current,
    assistant: assistantRef.current,
  };
}
