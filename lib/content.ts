import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Country, PhotoKey } from "@/data/countries";
import { HAIR_COLORS, HAIR_STYLES, SKINS, TOPS, type Avatar } from "./avatar";
import type { Photo } from "./images";

export type Gender = "girl" | "boy";

const Card = z.object({ title: z.string(), text: z.string() });
const Question = z.object({
  question: z.string(),
  correct: z.string(),
  wrong: z.array(z.string()),
  hint: z.string(),
});

/** What Claude (or the sample builder) writes for one child and one country. */
export const DeckDraftSchema = z.object({
  guide: z.object({
    name: z.string(),
    town: z.string(),
    skin: z.enum(SKINS),
    hairColor: z.enum(HAIR_COLORS),
    hairStyle: z.enum(HAIR_STYLES),
    top: z.enum(TOPS),
    glasses: z.boolean(),
  }),
  cards: z.object({
    hello: Card,
    where: Card,
    capital: Card,
    language: Card.extend({ words: z.array(z.object({ word: z.string(), meaning: z.string(), say: z.string() })) }),
    food: Card.extend({ question: z.string() }),
    day: Card.extend({ timeline: z.array(z.object({ time: z.string(), what: z.string() })), question: z.string() }),
    celebrate: Card,
    play: Card,
    didYouKnow: Card,
    yourTurn: Card,
  }),
  photoSubjects: z.object({
    hello: z.string(),
    capital: z.string(),
    food: z.string(),
    celebrate: z.string(),
    play: z.string(),
    didYouKnow: z.string(),
  }),
  quiz: z.array(Question),
  review: z.array(Question),
});
export type DeckDraft = z.infer<typeof DeckDraftSchema>;

export const CARD_ORDER = [
  ["hello", "Hello"],
  ["where", "Where I live"],
  ["capital", "Our capital"],
  ["language", "How we talk"],
  ["food", "What I eat"],
  ["day", "My day"],
  ["celebrate", "What we believe and celebrate"],
  ["play", "Play and animals"],
  ["didYouKnow", "Did you know?"],
  ["yourTurn", "Your turn"],
] as const;
export type CardKey = (typeof CARD_ORDER)[number][0];

export type StoredCard = {
  key: CardKey;
  tag: string;
  title: string;
  text: string;
  question?: string;
  words?: { word: string; meaning: string; say: string }[];
  timeline?: { time: string; what: string }[];
  photo: Photo | null;
};
export type StoredQuestion = { question: string; answers: string[]; correct: number; hint: string };
export type StoredDeck = {
  guide: { name: string; age: number; gender: Gender; town: string; avatar: Avatar };
  cards: StoredCard[];
  quiz: StoredQuestion[];
  review: StoredQuestion[];
};

export const QUIZ_QUESTIONS = 4;
export const REVIEW_QUESTIONS = 2;

/** Problems that make a draft unusable. An empty list means it can be saved. */
export function checkDraft(draft: DeckDraft): string[] {
  const problems: string[] = [];
  for (const [key] of CARD_ORDER) {
    const card = draft.cards[key];
    if (!card.title.trim() || !card.text.trim()) problems.push(`card "${key}" is empty`);
  }
  if (draft.cards.language.words.length !== 3) problems.push("language card needs exactly 3 words");
  const steps = draft.cards.day.timeline.length;
  if (steps < 4 || steps > 6) problems.push("day card needs 4 to 6 timeline steps");
  if (draft.quiz.length !== QUIZ_QUESTIONS) problems.push(`quiz needs exactly ${QUIZ_QUESTIONS} questions`);
  if (draft.review.length !== REVIEW_QUESTIONS) problems.push(`review needs exactly ${REVIEW_QUESTIONS} questions`);
  for (const q of [...draft.quiz, ...draft.review]) {
    const answers = [q.correct, ...q.wrong].map((a) => a.trim().toLowerCase());
    if (q.wrong.length !== 2 || new Set(answers).size !== 3 || answers.includes("")) {
      problems.push(`question "${q.question}" needs 1 correct and 2 different wrong answers`);
    }
  }
  if (!draft.guide.name.trim() || !draft.guide.town.trim()) problems.push("guide needs a name and a town");
  return problems;
}

export function buildPrompt(country: Country, learner: { age: number; gender: Gender }, guideGender: Gender): string {
  return `You are writing one lesson for a children's geography app. A fictional guide child from ${country.name} introduces their country to a learner.

Learner: a ${learner.age}-year-old ${learner.gender}. Write every word so a ${learner.age}-year-old can read and enjoy it on their own: ${
    learner.age <= 7
      ? "very short sentences, simple words, at most 2 sentences per card"
      : learner.age <= 10
        ? "short clear sentences, 2 to 3 sentences per card"
        : "3 to 4 sentences per card, with real detail and a few numbers, never babyish"
  }.

Guide: a ${guideGender}, also ${learner.age} years old, with a first name common in ${country.name}, living in a real named town or region there. Choose avatar parts that fit a child from that place, in everyday clothes.

These facts are fixed. Anything you say about them must agree with them exactly:
- Capital: ${country.capital}
- Languages: ${country.languages.join(", ")}
- Main religions: ${country.religions.join(", ")}
- Population: ${country.population}
- Money: ${country.currency}
- Location: ${country.location}
- Continent: ${country.continent}

Background you may use: landmark: ${country.landmark}. Food: ${country.dish}. Animal: ${country.animal}. Celebration: ${country.festival}. Fact: ${country.funFact} Words: ${country.words.map((w) => `${w.word} = ${w.meaning}`).join("; ")}.

Rules for the ten cards, all spoken by the guide in the first person:
- hello: greet in the local language, give name, age and home town.
- where: where the country is on the globe and what is around it.
- capital: the capital city and one thing about it.
- language: the language(s), plus exactly 3 words to try, each with meaning and a simple say-it-like-this spelling.
- food: what the guide eats, then a question asking the learner about their own food.
- day: one or two sentences, a timeline of 4 to 6 steps through the guide's school day, then a question asking the learner about their day.
- celebrate: the main religions described neutrally and respectfully, and one celebration the guide enjoys.
- play: games or sport the guide likes, and an animal that lives in the country.
- didYouKnow: one surprising true fact.
- yourTurn: one open question with no right answer that invites the learner to share something about their own life.
- Be concrete: "I eat", "my school starts at", never "people here eat".
- One child is not a whole country: say "in my family" or "where I live", and on at least one card mention that other children in ${country.name} live differently.
- Present-day everyday life. No national costumes, no stereotypes, nothing frightening, no poverty or conflict framing.
- Only state things you are confident are true.

photoSubjects: for each of hello, capital, food, celebrate, play, didYouKnow give the exact title of an English Wikipedia article whose main picture would suit that card (a place, dish, building, animal or object, never a named living person).

quiz: exactly ${QUIZ_QUESTIONS} multiple-choice questions answered by the cards, including one on the capital and one on the language. review: exactly ${REVIEW_QUESTIONS} more for a later recap, each naming ${country.name} in the question. Every question has one correct answer, exactly 2 wrong answers that are clearly wrong, and a kind hint that points to the answer without giving it away.`;
}

type ParseClient = {
  messages: { parse: (args: any) => Promise<{ parsed_output: unknown; stop_reason: string | null }> };
};

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** One Claude call. Throws if the model declines or the draft does not pass checkDraft. */
export async function generateDraft(
  country: Country,
  learner: { age: number; gender: Gender },
  guideGender: Gender,
  client: ParseClient = new Anthropic(),
): Promise<DeckDraft> {
  const response = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { format: zodOutputFormat(DeckDraftSchema), effort: "medium" },
    messages: [{ role: "user", content: buildPrompt(country, learner, guideGender) }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to write this lesson");
  const parsed = DeckDraftSchema.safeParse(response.parsed_output);
  if (!parsed.success) throw new Error("Claude's answer did not have the expected shape");
  const problems = checkDraft(parsed.data);
  if (problems.length > 0) throw new Error(`Lesson failed checks: ${problems.join("; ")}`);
  return parsed.data;
}

function shuffled(q: DeckDraft["quiz"][number], rand: () => number): StoredQuestion {
  const answers = [q.correct, ...q.wrong];
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  return { question: q.question, answers, correct: answers.indexOf(q.correct), hint: q.hint };
}

/** Turns a checked draft into the deck that is saved: photos looked up, answers shuffled. */
export async function buildDeck(
  draft: DeckDraft,
  country: Country,
  learnerAge: number,
  guideGender: Gender,
  findPhotos: (subjects: string[]) => Promise<Record<string, Photo | null>>,
  rand: () => number = Math.random,
): Promise<StoredDeck> {
  const photoKeys = Object.keys(country.photos) as PhotoKey[];
  // Ask for the suggested and the bundled subjects together, so the lookup stays at two requests.
  const found = await findPhotos([...new Set(photoKeys.flatMap((key) => [draft.photoSubjects[key], country.photos[key]]))]);
  const photos = Object.fromEntries(
    photoKeys.map((key) => [key, found[draft.photoSubjects[key]] ?? found[country.photos[key]] ?? null]),
  ) as Record<PhotoKey, Photo | null>;

  const { name, town, ...avatar } = draft.guide;
  return {
    guide: { name, town, age: learnerAge, gender: guideGender, avatar },
    cards: CARD_ORDER.map(([key, tag]) => ({
      key,
      tag,
      ...draft.cards[key],
      photo: key in photos ? photos[key as PhotoKey] : null,
    })),
    quiz: draft.quiz.map((q) => shuffled(q, rand)),
    review: draft.review.map((q) => shuffled(q, rand)),
  };
}
