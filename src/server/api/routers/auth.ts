import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.create({
        data: {
          username: input.username,
        },
      });

      return user;
    }),

  getCurrentUser: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.userId) {
        return null;
      }

      try {
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });
        return user;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    }),
});
