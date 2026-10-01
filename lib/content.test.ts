import { describe, expect, it } from "vitest";
import { COUNTRIES, getCountry } from "@/data/countries";
import { buildDeck, buildPrompt, checkDraft, generateDraft } from "./content";
import { sampleDraft } from "./sample";

const japan = getCountry("JP")!;
const learner = { age: 8, gender: "girl" as const };
const fakeClient = (parsed_output: unknown, stop_reason = "end_turn") => ({
  messages: { parse: async () => ({ parsed_output, stop_reason }) },
});

describe("sampleDraft", () => {
  it.each(COUNTRIES.map((c) => [c.code, c] as const))("passes every check for %s", (_code, country) => {
    expect(checkDraft(sampleDraft(country, "girl"))).toEqual([]);
    expect(checkDraft(sampleDraft(country, "boy"))).toEqual([]);
  });
});

describe("checkDraft", () => {
  it("rejects the wrong number of quiz questions", () => {
    const draft = sampleDraft(japan, "girl");
    draft.quiz.pop();
    expect(checkDraft(draft)).toContain("quiz needs exactly 4 questions");
  });

  it("rejects a question whose wrong answer repeats the right one", () => {
    const draft = sampleDraft(japan, "girl");
    draft.quiz[0].wrong = ["tokyo", "Osaka"];
    expect(checkDraft(draft).join()).toMatch(/needs 1 correct and 2 different wrong answers/);
  });

  it("rejects an empty card", () => {
    const draft = sampleDraft(japan, "girl");
    draft.cards.food.text = " ";
    expect(checkDraft(draft)).toContain('card "food" is empty');
  });
});

describe("buildPrompt", () => {
  it("carries the fixed facts and the learner's age", () => {
    const prompt = buildPrompt(japan, learner, "boy");
    expect(prompt).toContain("Capital: Tokyo");
    expect(prompt).toContain("8-year-old girl");
    expect(prompt).toContain("Guide: a boy");
  });
});

describe("generateDraft", () => {
  it("returns a valid draft", async () => {
    const draft = sampleDraft(japan, "girl");
    expect(await generateDraft(japan, learner, "girl", fakeClient(draft))).toEqual(draft);
  });

  it("throws when the answer has the wrong shape", async () => {
    await expect(generateDraft(japan, learner, "girl", fakeClient({ guide: {} }))).rejects.toThrow(/expected shape/);
    await expect(generateDraft(japan, learner, "girl", fakeClient(null))).rejects.toThrow(/expected shape/);
  });

  it("throws when a check fails", async () => {
    const draft = sampleDraft(japan, "girl");
    draft.review = [];
    await expect(generateDraft(japan, learner, "girl", fakeClient(draft))).rejects.toThrow(/review needs exactly 2/);
  });

  it("throws when Claude declines", async () => {
    await expect(generateDraft(japan, learner, "girl", fakeClient(null, "refusal"))).rejects.toThrow(/declined/);
  });
});

describe("buildDeck", () => {
  const photo = (subject: string) => ({
    url: `https://img/${subject}`,
    author: "A",
    licence: "CC0",
    licenceUrl: null,
    sourceUrl: "https://src",
  });

  it("makes ten cards in order, with photos only where a card has a subject", async () => {
    const deck = await buildDeck(sampleDraft(japan, "girl"), japan, 8, "girl", async (subjects) => Object.fromEntries(subjects.map((s) => [s, photo(s)])));
    expect(deck.cards.map((c) => c.key)).toEqual([
      "hello", "where", "capital", "language", "food", "day", "celebrate", "play", "didYouKnow", "yourTurn",
    ]);
    expect(deck.cards.find((c) => c.key === "food")!.photo!.url).toBe("https://img/Onigiri");
    expect(deck.cards.find((c) => c.key === "where")!.photo).toBeNull();
    expect(deck.guide).toMatchObject({ name: "Yuki", age: 8, gender: "girl", town: "Kamakura" });
  });

  it("falls back to the bundled subject, then to no photo", async () => {
    const draft = sampleDraft(japan, "girl");
    draft.photoSubjects.food = "Something obscure";
    const deck = await buildDeck(draft, japan, 8, "girl", async (subjects) =>
      Object.fromEntries(subjects.map((s) => [s, s === "Onigiri" ? photo(s) : null])),
    );
    expect(deck.cards.find((c) => c.key === "food")!.photo!.url).toBe("https://img/Onigiri");
    expect(deck.cards.find((c) => c.key === "capital")!.photo).toBeNull();
  });

  it("keeps the correct answer correct after shuffling", async () => {
    const draft = sampleDraft(japan, "girl");
    for (const r of [0, 0.5, 0.99]) {
      const deck = await buildDeck(draft, japan, 8, "girl", async () => ({}), () => r);
      deck.quiz.forEach((q, i) => expect(q.answers[q.correct]).toBe(draft.quiz[i].correct));
    }
  });
});
