import { tracked } from "@trpc/server";
import EventEmitter, { on } from "events";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const ee = new EventEmitter();

export const pokerRouter = createTRPCRouter({
  joinRoom: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerId: z.string(),
        playerName: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { roomId, playerId, playerName } = input;

      return await ctx.db.$transaction(async (tx) => {
        const existingRoom = await tx.room.findUnique({
          where: { id: roomId },
          include: {
            users: true,
            currentGame: true,
          },
        });

        const isUserAlreadyInRoom = existingRoom?.users.some(
          (u) => u.id === playerId,
        );

        if (
          !isUserAlreadyInRoom &&
          existingRoom &&
          existingRoom.users.length >= 10
        ) {
          throw new Error(
            "Room is full (maximum 10 players). For enterprise solutions with higher capacity, please contact contact@michkoff.com to discuss partnership opportunities.",
          );
        }

        await tx.user.upsert({
          where: { id: playerId },
          update: { username: playerName },
          create: { id: playerId, username: playerName },
        });

        let room = await tx.room.upsert({
          where: { id: roomId },
          update: {},
          create: { id: roomId, name: `Planning Room ${roomId}` },
          include: {
            currentGame: true,
            users: true,
          },
        });

        if (!isUserAlreadyInRoom) {
          room = await tx.room.update({
            where: { id: roomId },
            data: {
              users: {
                connect: { id: playerId },
              },
            },
            include: {
              currentGame: true,
              users: true,
            },
          });
        }

        let currentGame = room.currentGame;

        if (!currentGame || currentGame.isRevealed) {
          currentGame = await tx.game.create({
            data: {
              title: "Planning Session",
              roomId,
              isRevealed: false,
            },
          });

          await tx.room.update({
            where: { id: roomId },
            data: { currentGameId: currentGame.id },
          });

          await tx.roomHistory.create({
            data: {
              roomId,
              gameId: currentGame.id,
              isActive: true,
            },
          });
        }

        const players = await tx.user.findMany({
          where: {
            rooms: {
              some: { id: roomId },
            },
          },
          include: {
            votes: {
              where: { gameId: currentGame.id },
            },
          },
        });

        const playersData = players.map((player) => ({
          id: player.id,
          name: player.username,
          selectedCard: player.votes[0]?.card ?? null,
        }));

        ee.emit(`room:${roomId}`, {
          type: "playerJoined",
          roomId,
          players: playersData,
          gameId: currentGame.id,
          isRevealed: currentGame.isRevealed,
          timestamp: Date.now(),
        });

        return {
          success: true,
          players: playersData,
          gameId: currentGame.id,
          isRevealed: currentGame.isRevealed,
        };
      });
    }),

  selectCard: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerId: z.string(),
        cardValue: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { roomId, playerId, cardValue } = input;

      return await ctx.db.$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { id: roomId },
          include: {
            currentGame: true,
            users: true,
          },
        });

        if (!room || !room.currentGame) {
          throw new Error("No active game found for this room");
        }

        const currentGame = room.currentGame;

        if (currentGame.isRevealed) {
          throw new Error(
            "Cards are already revealed. Start a new round to vote again.",
          );
        }

        const isUserInRoom = room.users.some((u) => u.id === playerId);
        if (!isUserInRoom) {
          throw new Error("User is not a member of this room");
        }

        await tx.userCard.upsert({
          where: {
            userId_gameId: {
              userId: playerId,
              gameId: currentGame.id,
            },
          },
          update: {
            card: cardValue,
          },
          create: {
            userId: playerId,
            gameId: currentGame.id,
            card: cardValue,
          },
        });

        const players = await tx.user.findMany({
          where: {
            rooms: {
              some: { id: roomId },
            },
          },
          include: {
            votes: {
              where: { gameId: currentGame.id },
            },
          },
        });

        const playersData = players.map((player) => ({
          id: player.id,
          name: player.username,
          selectedCard: player.votes[0]?.card ?? null,
        }));

        const allPlayersVoted = playersData.every(
          (p) => p.selectedCard !== null,
        );
        let isRevealed: boolean = currentGame.isRevealed;

        if (
          allPlayersVoted &&
          playersData.length > 0 &&
          !currentGame.isRevealed
        ) {
          await tx.game.update({
            where: { id: currentGame.id },
            data: { isRevealed: true },
          });
          isRevealed = true;

          ee.emit(`room:${roomId}`, {
            type: "cardsRevealed",
            roomId,
            players: playersData,
            gameId: currentGame.id,
            isRevealed: true,
            allPlayersVoted: true,
            timestamp: Date.now(),
          });
        } else {
          ee.emit(`room:${roomId}`, {
            type: "cardSelected",
            roomId,
            playerId,
            cardValue,
            players: playersData,
            gameId: currentGame.id,
            isRevealed: false,
            allPlayersVoted,
            timestamp: Date.now(),
          });
        }

        const player = playersData.find((p) => p.id === playerId);
        return {
          success: true,
          player,
          isRevealed,
          allPlayersVoted,
          gameId: currentGame.id,
        };
      });
    }),

  startNewRound: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { roomId } = input;

      return await ctx.db.$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { id: roomId },
          include: {
            currentGame: true,
            users: true,
          },
        });

        if (!room) {
          throw new Error("Room not found");
        }

        if (room.currentGame) {
          await tx.game.update({
            where: { id: room.currentGame.id },
            data: { isRevealed: true },
          });

          await tx.roomHistory.updateMany({
            where: {
              roomId,
              gameId: room.currentGame.id,
              isActive: true,
            },
            data: {
              isActive: false,
              endedAt: new Date(),
            },
          });
        }

        const newGame = await tx.game.create({
          data: {
            title: "Planning Session",
            roomId,
            isRevealed: false,
          },
        });

        await tx.room.update({
          where: { id: roomId },
          data: { currentGameId: newGame.id },
        });

        await tx.roomHistory.create({
          data: {
            roomId,
            gameId: newGame.id,
            isActive: true,
          },
        });

        const playersData = room.users.map((player) => ({
          id: player.id,
          name: player.username,
          selectedCard: null,
        }));

        ee.emit(`room:${roomId}`, {
          type: "newRoundStarted",
          roomId,
          players: playersData,
          gameId: newGame.id,
          isRevealed: false,
          allPlayersVoted: false,
          timestamp: Date.now(),
        });

        return {
          success: true,
          players: playersData,
          gameId: newGame.id,
        };
      });
    }),

  getRoomState: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { roomId } = input;

      const room = await ctx.db.room.findUnique({
        where: { id: roomId },
        include: {
          currentGame: true,
          users: {
            include: {
              votes: {
                where: {
                  game: {
                    roomId,
                  },
                },
                orderBy: {
                  game: {
                    id: "desc",
                  },
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }

      if (!room.currentGame) {
        return {
          players: room.users.map((user) => ({
            id: user.id,
            name: user.username,
            selectedCard: null,
          })),
          isRevealed: false,
          allPlayersVoted: false,
          gameId: null,
        };
      }

      const playersWithVotes = await ctx.db.user.findMany({
        where: {
          rooms: {
            some: { id: roomId },
          },
        },
        include: {
          votes: {
            where: { gameId: room.currentGame.id },
          },
        },
      });

      const playersData = playersWithVotes.map((player) => ({
        id: player.id,
        name: player.username,
        selectedCard: player.votes[0]?.card ?? null,
      }));

      const allPlayersVoted =
        playersData.every((p) => p.selectedCard !== null) &&
        playersData.length > 0;

      return {
        players: playersData,
        isRevealed: room.currentGame.isRevealed,
        allPlayersVoted,
        gameId: room.currentGame.id,
      };
    }),

  getRoomHistory: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { roomId, limit } = input;

      const history = await ctx.db.roomHistory.findMany({
        where: { roomId },
        include: {
          game: {
            include: {
              votes: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: limit,
      });

      return history.map((entry) => ({
        id: entry.id,
        gameId: entry.gameId,
        gameTitle: entry.game.title,
        startedAt: entry.startedAt,
        endedAt: entry.endedAt,
        isActive: entry.isActive,
        isRevealed: entry.game.isRevealed,
        votes: entry.game.votes.map((vote) => ({
          userId: vote.userId,
          userName: vote.user.username,
          card: vote.card,
        })),
      }));
    }),

  onRoomUpdate: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        lastEventId: z.string().nullish(),
      }),
    )
    .subscription(async function* (opts) {
      const roomId = opts.input.roomId;
      if (!roomId) {
        throw new Error("Room ID is required");
      }

      if (opts.input.lastEventId) {
        try {
          const room = await opts.ctx.db.room.findUnique({
            where: { id: roomId },
            include: {
              currentGame: true,
              users: {
                include: {
                  votes: {
                    where: {
                      game: {
                        roomId,
                      },
                    },
                    orderBy: {
                      game: {
                        id: "desc",
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          });

          if (room && room.currentGame) {
            const playersWithVotes = await opts.ctx.db.user.findMany({
              where: {
                rooms: {
                  some: { id: roomId },
                },
              },
              include: {
                votes: {
                  where: { gameId: room.currentGame.id },
                },
              },
            });

            const playersData = playersWithVotes.map((player) => ({
              id: player.id,
              name: player.username,
              selectedCard: player.votes[0]?.card ?? null,
            }));

            yield tracked(`${roomId}-${Date.now()}`, {
              type: "roomState",
              roomId,
              players: playersData,
              gameId: room.currentGame.id,
              isRevealed: room.currentGame.isRevealed,
              allPlayersVoted:
                playersData.every((p) => p.selectedCard !== null) &&
                playersData.length > 0,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Error sending initial room state:", error);
        }
      }

      for await (const [data] of on(ee, `room:${roomId}`, {
        signal: opts.signal,
      })) {
        const event = data as {
          type: string;
          roomId: string;
          playerId?: string;
          cardValue?: string;
          players: Array<{
            id: string;
            name: string;
            selectedCard: string | null;
          }>;
          gameId: string;
          isRevealed?: boolean;
          allPlayersVoted?: boolean;
          timestamp: number;
        };

        yield tracked(`${roomId}-${event.timestamp}`, event);
      }
    }),
});
