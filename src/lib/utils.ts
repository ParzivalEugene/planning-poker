import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a readable room ID in format: abc-defg-jkl
export function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";

  const generateSegment = (length: number) => {
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  };

  return `${generateSegment(3)}-${generateSegment(4)}-${generateSegment(3)}`;
}

// Validate room ID format
export function isValidRoomId(roomId: unknown): boolean {
  if (typeof roomId !== "string") {
    return false;
  }
  const pattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  return pattern.test(roomId);
}
