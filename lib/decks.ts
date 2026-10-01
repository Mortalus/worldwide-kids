import type { Country, PhotoKey } from "@/data/countries";
import { buildDeck, generateDraft, hasApiKey, type Gender, type StoredDeck } from "./content";
import type { Child } from "./db";
import { findPhotos } from "./images";
import { sampleDraft } from "./sample";

/**
 * Writes the deck for one child and country: Claude when a key is configured (one retry),
 * otherwise the labelled sample text. Throws if Claude fails twice, so nothing half-built is saved.
 */
export async function makeDeck(
  child: Child,
  country: Country,
  guideGender: Gender,
): Promise<{ deck: StoredDeck; source: "ai" | "sample" }> {
  if (!hasApiKey()) {
    const deck = await buildDeck(sampleDraft(country, guideGender), country, child.age, guideGender, findPhotos);
    return { deck, source: "sample" };
  }
  const learner = { age: child.age, gender: child.gender };
  let draft;
  try {
    draft = await generateDraft(country, learner, guideGender);
  } catch (first) {
    console.error("Lesson generation failed, retrying once:", first);
    draft = await generateDraft(country, learner, guideGender);
  }
  return { deck: await buildDeck(draft, country, child.age, guideGender, findPhotos), source: "ai" };
}

/**
 * Second chance for cards whose photo lookup failed when the deck was made (for example while
 * Wikimedia was rate-limiting). Returns the repaired deck, or null if nothing changed.
 */
export async function refillPhotos(deck: StoredDeck, country: Country): Promise<StoredDeck | null> {
  const missing = deck.cards.filter((card) => card.key in country.photos && !card.photo);
  if (missing.length === 0) return null;
  const found = await findPhotos(missing.map((card) => country.photos[card.key as PhotoKey]));
  let changed = false;
  const cards = deck.cards.map((card) => {
    const photo = missing.includes(card) ? found[country.photos[card.key as PhotoKey]] : null;
    if (!photo) return card;
    changed = true;
    return { ...card, photo };
  });
  return changed ? { ...deck, cards } : null;
}
