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

type AssistantEvent = {
  type?: string;
  character?: { id: string };
  action?: AssistantAction;
};

type AssistantInstance = {
  on: (event: string, handler: (data: AssistantEvent) => void) => void;
  sendData?: (data: {
    action: { action_id: string; parameters: unknown };
  }) => void;
  destroy?: () => void;
};

const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];

const initializeAssistant = (
  getState: () => Record<string, unknown>,
): AssistantInstance => {
  if (process.env.NODE_ENV === "development") {
    return createSmartappDebugger({
      token: env.NEXT_PUBLIC_SALUTE_TOKEN,
      initPhrase: `Запусти ${env.NEXT_PUBLIC_SALUTE_SMARTAPP}`,
      getState,
      nativePanel: {
        defaultText: "выбери карту 5",
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
  const onSelectCardRef = useRef(onSelectCard);
  const onStartNewRoundRef = useRef(onStartNewRound);
  const roomStateRef = useRef(roomState);

  useEffect(() => {
    onSelectCardRef.current = onSelectCard;
  }, [onSelectCard]);

  useEffect(() => {
    onStartNewRoundRef.current = onStartNewRound;
  }, [onStartNewRound]);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  const getStateForAssistant = () => {
    const state = {
      item_selector: {
        items: [
          ...CARD_VALUES.map((card, index) => ({
            number: index + 1,
            id: `card_${card}`,
            title: `карту ${card}`,
          })),
          {
            number: CARD_VALUES.length + 1,
            id: "new_round",
            title: "новый раунд",
          },
        ],
        ignored_words: [
          "выбери",
          "поставь",
          "возьми",
          "выбираю",
          "начни",
          "начать",
          "запусти",
          "старт",
          "следующий",
        ],
      },
    };

    return state;
  };

  const dispatchAssistantAction = (action: AssistantAction) => {
    if (action) {
      switch (action.type) {
        case "select_card":
          if (action.cardValue && CARD_VALUES.includes(action.cardValue)) {
            onSelectCardRef.current(action.cardValue);
          }
          break;

        case "start_new_round":
          onStartNewRoundRef.current();
          break;

        default:
          console.warn("Unknown action type:", action.type);
      }
    }
  };

  useEffect(() => {
    if (!env.NEXT_PUBLIC_SALUTE_TOKEN || !env.NEXT_PUBLIC_SALUTE_SMARTAPP) {
      console.warn("Salute credentials not found in environment variables");
      return;
    }

    try {
      assistantRef.current = initializeAssistant(() => getStateForAssistant());

      assistantRef.current.on("data", (event: AssistantEvent) => {
        if (event.action) {
          dispatchAssistantAction(event.action);
        }
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

  return {
    isActive: !!assistantRef.current,
    assistant: assistantRef.current,
  };
}
