import { getRandomCombination } from ".";

export function createRoomSlug() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";

  return getRandomCombination(8, characters);
}
