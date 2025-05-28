/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Room` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currentGameId]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `card` on the `UserCard` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_roomId_fkey";

-- DropForeignKey
ALTER TABLE "UserCard" DROP CONSTRAINT "UserCard_gameId_fkey";

-- DropForeignKey
ALTER TABLE "UserCard" DROP CONSTRAINT "UserCard_userId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "createdAt",
ADD COLUMN     "currentGameId" TEXT;

-- AlterTable
ALTER TABLE "UserCard" DROP COLUMN "card",
ADD COLUMN     "card" TEXT NOT NULL;

-- DropEnum
DROP TYPE "CardType";

-- CreateTable
CREATE TABLE "RoomHistory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoomHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomHistory_roomId_isActive_idx" ON "RoomHistory"("roomId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RoomHistory_roomId_gameId_key" ON "RoomHistory"("roomId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_currentGameId_key" ON "Room"("currentGameId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_currentGameId_fkey" FOREIGN KEY ("currentGameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomHistory" ADD CONSTRAINT "RoomHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomHistory" ADD CONSTRAINT "RoomHistory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
