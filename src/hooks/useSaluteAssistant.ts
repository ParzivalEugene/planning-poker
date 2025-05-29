"use client";

import { env } from "@/env";
import { createAssistant, createSmartappDebugger } from "@salutejs/client";
import { useCallback, useEffect, useRef } from "react";

type AssistantAction = {
  type: "select_card" | "start_new_round";
  cardValue?: string;
};

type SaluteAssistantProps = {
  roomId: string;
  players: Array<{ id: string; name: string; selectedCard: string | null }>;
  isRevealed: boolean;
  allPlayersVoted: boolean;
  onSelectCard: (cardValue: string) => void;
  onStartNewRound: () => void;
};

export function useSaluteAssistant({
  roomId,
  players,
  isRevealed,
  allPlayersVoted,
  onSelectCard,
  onStartNewRound,
}: SaluteAssistantProps) {
  const assistantRef = useRef<any>(null);

  const getStateForAssistant = useCallback(() => {
    const availableCards = [
      "0",
      "1",
      "2",
      "3",
      "5",
      "8",
      "13",
      "20",
      "40",
      "100",
    ];

    return {
      poker_planning: {
        room_id: roomId,
        players_count: players.length,
        is_revealed: isRevealed,
        all_players_voted: allPlayersVoted,
        available_cards: availableCards,
        can_start_new_round: isRevealed && allPlayersVoted,
        can_select_card: !isRevealed,
        players: players.map((player, index) => ({
          number: index + 1,
          id: player.id,
          name: player.name,
          has_voted: player.selectedCard !== null,
        })),
        ignored_words: [
          "выбери",
          "поставь",
          "возьми",
          "карта",
          "карту", // select card
          "начни",
          "начать",
          "новый",
          "раунд",
          "следующий",
          "сначала", // start new round
        ],
      },
    };
  }, [roomId, players, isRevealed, allPlayersVoted]);

  const dispatchAssistantAction = useCallback(
    (action: AssistantAction) => {
      console.log("Salute assistant action:", action);

      switch (action.type) {
        case "select_card":
          if (action.cardValue && !isRevealed) {
            onSelectCard(action.cardValue);
          }
          break;

        case "start_new_round":
          if (isRevealed && allPlayersVoted) {
            onStartNewRound();
          }
          break;

        default:
          console.warn("Unknown assistant action:", action);
      }
    },
    [isRevealed, allPlayersVoted, onSelectCard, onStartNewRound],
  );

  const initializeAssistant = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      return createSmartappDebugger({
        token: env.NEXT_PUBLIC_SALUTE_TOKEN,
        initPhrase: `Запусти ${env.NEXT_PUBLIC_SALUTE_SMARTAPP}`,
        getState: getStateForAssistant,
        nativePanel: {
          defaultText: "выбери 3",
          screenshotMode: false,
          tabIndex: -1,
        },
      });
    } else {
      return createAssistant({
        getState: getStateForAssistant,
      });
    }
  }, [getStateForAssistant]);

  useEffect(() => {
    if (!assistantRef.current) {
      try {
        assistantRef.current = initializeAssistant();

        assistantRef.current.on("data", (event: any) => {
          console.log("Salute assistant data:", event);

          if (event.type === "character") {
            console.log(`Assistant character: "${event?.character?.id}"`);
          } else if (event.type === "insets") {
            console.log("Assistant insets");
          } else if (event.action) {
            dispatchAssistantAction(event.action);
          }
        });

        assistantRef.current.on("start", (event: any) => {
          const initialData = assistantRef.current?.getInitialData();
          console.log("Salute assistant started:", event, initialData);
        });

        assistantRef.current.on("command", (event: any) => {
          console.log("Salute assistant command:", event);
        });

        assistantRef.current.on("error", (event: any) => {
          console.error("Salute assistant error:", event);
        });

        assistantRef.current.on("tts", (event: any) => {
          console.log("Salute assistant TTS:", event);
        });
      } catch (error) {
        console.error("Failed to initialize Salute assistant:", error);
      }
    }

    return () => {
      if (assistantRef.current) {
        try {
          assistantRef.current.destroy?.();
        } catch (error) {
          console.error("Error destroying assistant:", error);
        }
        assistantRef.current = null;
      }
    };
  }, [initializeAssistant, dispatchAssistantAction]);

  const sendActionValue = useCallback((actionId: string, value: any) => {
    if (assistantRef.current) {
      const data = {
        action: {
          action_id: actionId,
          parameters: {
            value: value,
          },
        },
      };

      const unsubscribe = assistantRef.current.sendData(
        data,
        (response: any) => {
          console.log("Salute assistant response:", response);
          unsubscribe();
        },
      );
    }
  }, []);

  return {
    sendActionValue,
    isAssistantReady: !!assistantRef.current,
  };
}
