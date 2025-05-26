import { tracked } from "@trpc/server";
import EventEmitter, { on } from "events";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

// Event emitter for real-time updates
const ee = new EventEmitter();

export const pokerRouter = createTRPCRouter({
  // Join a room - creates room and game if needed, adds user to room
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

      // Check if user is already in the room
      const existingRoom = await ctx.db.room.findUnique({
        where: { id: roomId },
        include: {
          users: true,
        },
      });

      const isUserAlreadyInRoom = existingRoom?.users.some(
        (u) => u.id === playerId,
      );

      // If user is not in room, check capacity (max 10 players)
      if (
        !isUserAlreadyInRoom &&
        existingRoom &&
        existingRoom.users.length >= 10
      ) {
        throw new Error(
          "Room is full (maximum 10 players). For enterprise solutions with higher capacity, please contact contact@michkoff.com to discuss partnership opportunities.",
        );
      }

      // Ensure user exists
      const user = await ctx.db.user.upsert({
        where: { id: playerId },
        update: { username: playerName },
        create: { id: playerId, username: playerName },
      });

      // Ensure room exists (create if not found)
      const room = await ctx.db.room.upsert({
        where: { id: roomId },
        update: {},
        create: { id: roomId, name: `Planning Room ${roomId}` },
      });

      // Add user to room if not already there
      await ctx.db.room.update({
        where: { id: roomId },
        data: {
          users: {
            connectOrCreate: {
              where: { id: playerId },
              create: { id: playerId, username: playerName },
            },
          },
        },
      });

      // Get or create current game for this room
      let game = await ctx.db.game.findFirst({
        where: { roomId, isRevealed: false },
        orderBy: { id: "desc" },
      });

      game ??= await ctx.db.game.create({
        data: {
          title: "Planning Session",
          roomId,
          isRevealed: false,
        },
      });

      // Get all players in the room with their votes
      const players = await ctx.db.user.findMany({
        where: {
          rooms: {
            some: { id: roomId },
          },
        },
        include: {
          votes: {
            where: { gameId: game.id },
          },
        },
      });

      const playersData = players.map((player) => ({
        id: player.id,
        name: player.username,
        selectedCard: player.votes[0]?.card ?? null,
      }));

      // Emit room update
      ee.emit(`room:${roomId}`, {
        type: "playerJoined",
        roomId,
        players: playersData,
        timestamp: Date.now(),
      });

      return { success: true, players: playersData };
    }),

  // Select a card
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

      // Get current game for this room
      const game = await ctx.db.game.findFirst({
        where: { roomId, isRevealed: false },
        orderBy: { id: "desc" },
      });

      if (!game) {
        throw new Error("No active game found for this room");
      }

      // Don't allow voting on revealed games
      if (game.isRevealed) {
        throw new Error(
          "Cards are already revealed. Start a new round to vote again.",
        );
      }

      // Upsert the user's vote
      await ctx.db.userCard.upsert({
        where: {
          userId_gameId: {
            userId: playerId,
            gameId: game.id,
          },
        },
        update: {
          card: cardValue,
        },
        create: {
          userId: playerId,
          gameId: game.id,
          card: cardValue,
        },
      });

      // Get all players in the room with their votes
      const players = await ctx.db.user.findMany({
        where: {
          rooms: {
            some: { id: roomId },
          },
        },
        include: {
          votes: {
            where: { gameId: game.id },
          },
        },
      });

      const playersData = players.map((player) => ({
        id: player.id,
        name: player.username,
        selectedCard: player.votes[0]?.card ?? null,
      }));

      // Emit card selection update
      ee.emit(`room:${roomId}`, {
        type: "cardSelected",
        roomId,
        playerId,
        cardValue,
        players: playersData,
        timestamp: Date.now(),
      });

      // Check if all players have voted and auto-reveal if so
      const allPlayersVoted = playersData.every((p) => p.selectedCard !== null);
      let isRevealed: boolean = game.isRevealed;

      if (allPlayersVoted && playersData.length > 0 && !game.isRevealed) {
        // Only reveal if not already revealed
        await ctx.db.game.update({
          where: { id: game.id },
          data: { isRevealed: true },
        });
        isRevealed = true;

        // Emit reveal event
        ee.emit(`room:${roomId}`, {
          type: "cardsRevealed",
          roomId,
          players: playersData,
          isRevealed: true,
          allPlayersVoted: true,
          timestamp: Date.now(),
        });
      }

      const player = playersData.find((p) => p.id === playerId);
      return { success: true, player, isRevealed };
    }),

  // Start a new round (creates a new game)
  startNewRound: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { roomId } = input;

      // Mark current game as revealed (archived)
      await ctx.db.game.updateMany({
        where: { roomId, isRevealed: false },
        data: { isRevealed: true },
      });

      // Create a new game
      const newGame = await ctx.db.game.create({
        data: {
          title: "Planning Session",
          roomId,
          isRevealed: false,
        },
      });

      // Get all players in the room (they'll have no votes in the new game)
      const players = await ctx.db.user.findMany({
        where: {
          rooms: {
            some: { id: roomId },
          },
        },
      });

      const playersData = players.map((player) => ({
        id: player.id,
        name: player.username,
        selectedCard: null,
      }));

      // Emit new round started update
      ee.emit(`room:${roomId}`, {
        type: "newRoundStarted",
        roomId,
        players: playersData,
        isRevealed: false,
        allPlayersVoted: false,
        timestamp: Date.now(),
      });

      return { success: true, players: playersData };
    }),

  // Get current room state
  getRoomState: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { roomId } = input;

      // Get current ACTIVE game for this room (non-revealed only)
      const game = await ctx.db.game.findFirst({
        where: { roomId, isRevealed: false },
        orderBy: { id: "desc" },
      });

      if (!game) {
        // If no active game, check if there are any games at all
        const anyGame = await ctx.db.game.findFirst({
          where: { roomId },
          orderBy: { id: "desc" },
        });

        if (anyGame) {
          // There are games but all are revealed - return revealed state
          const players = await ctx.db.user.findMany({
            where: {
              rooms: {
                some: { id: roomId },
              },
            },
            include: {
              votes: {
                where: { gameId: anyGame.id },
              },
            },
          });

          const playersData = players.map((player) => ({
            id: player.id,
            name: player.username,
            selectedCard: player.votes[0]?.card ?? null,
          }));

          return {
            players: playersData,
            isRevealed: true,
            allPlayersVoted: true,
          };
        }

        // No games at all
        return { players: [], isRevealed: false, allPlayersVoted: false };
      }

      // Get all players in the room with their votes for the active game
      const players = await ctx.db.user.findMany({
        where: {
          rooms: {
            some: { id: roomId },
          },
        },
        include: {
          votes: {
            where: { gameId: game.id },
          },
        },
      });

      const playersData = players.map((player) => ({
        id: player.id,
        name: player.username,
        selectedCard: player.votes[0]?.card ?? null,
      }));

      return {
        players: playersData,
        isRevealed: game.isRevealed,
        allPlayersVoted:
          playersData.every((p) => p.selectedCard !== null) &&
          playersData.length > 0,
      };
    }),

  // Subscribe to room updates
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

      // If client reconnects, send current state
      if (opts.input.lastEventId) {
        // Get current game for this room (including revealed games)
        const game = await opts.ctx.db.game.findFirst({
          where: { roomId },
          orderBy: { id: "desc" },
        });

        if (game) {
          // Get all players in the room with their votes
          const players = await opts.ctx.db.user.findMany({
            where: {
              rooms: {
                some: { id: roomId },
              },
            },
            include: {
              votes: {
                where: { gameId: game.id },
              },
            },
          });

          const playersData = players.map((player) => ({
            id: player.id,
            name: player.username,
            selectedCard: player.votes[0]?.card ?? null,
          }));

          yield tracked(`${roomId}-${Date.now()}`, {
            type: "roomState",
            roomId,
            players: playersData,
            isRevealed: game.isRevealed,
            allPlayersVoted:
              playersData.every((p) => p.selectedCard !== null) &&
              playersData.length > 0,
            timestamp: Date.now(),
          });
        }
      }

      // Listen for new events
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
          isRevealed?: boolean;
          allPlayersVoted?: boolean;
          timestamp: number;
        };

        // Track with timestamp to ensure proper ordering
        yield tracked(`${roomId}-${event.timestamp}`, event);
      }
    }),
});
