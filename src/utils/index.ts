export function getRandomCombination(length: number, characters: string) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((byte) => characters[byte % characters.length])
    .join("");
}
