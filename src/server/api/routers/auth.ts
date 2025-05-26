import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const { username } = input;

      // Create a new user (username doesn't need to be unique)
      const user = await ctx.db.user.create({
        data: {
          username,
        },
      });

      return {
        id: user.id,
        username: user.username,
      };
    }),

  getCurrentUser: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (!input.userId) {
        return null;
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
      };
    }),
});
