import { getRandomCombination } from ".";

export function getRandomUserNumHash() {
  const characters = "0123456789";

  return getRandomCombination(4, characters);
}
