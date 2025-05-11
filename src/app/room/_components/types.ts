/**
 * Represents a player in the planning poker session
 */
export type Player = {
  id: string;
  name: string;
  selectedCard: string | null;
};

/**
 * Position types for player cards around the table
 */
export type PlayerPosition = "top" | "bottom" | "left" | "right";
