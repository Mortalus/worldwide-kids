import { COUNTRIES, type Country } from "@/data/countries";

/** Next country for a child: never a repeat, and a different continent from last time when possible. */
export function pickCountry(
  visitedCodes: string[],
  lastContinent: string | null,
  rand: () => number = Math.random,
  pool: Country[] = COUNTRIES,
): Country | null {
  const unvisited = pool.filter((c) => !visitedCodes.includes(c.code));
  if (unvisited.length === 0) return null;
  const elsewhere = unvisited.filter((c) => c.continent !== lastContinent);
  const candidates = elsewhere.length > 0 ? elsewhere : unvisited;
  return candidates[Math.floor(rand() * candidates.length)];
}
