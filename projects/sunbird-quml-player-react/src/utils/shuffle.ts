/**
 * Fisher-Yates shuffle - unbiased array shuffle.
 * @returns Shuffled copy (original unchanged)
 */
export function fisherYatesShuffle<T>(arr: T[]): T[] {
  if (!Array.isArray(arr)) return [];

  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
