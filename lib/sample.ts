import type { Country } from "@/data/countries";
import { COUNTRIES } from "@/data/countries";
import type { Avatar } from "./avatar";
import type { DeckDraft, Gender } from "./content";

const LOOKS: Record<string, Omit<Avatar, "glasses">> = {
  JP: { skin: "fair", hairColor: "black", hairStyle: "bob", top: "blue" },
  IN: { skin: "brown", hairColor: "black", hairStyle: "braids", top: "yellow" },
  KE: { skin: "deep", hairColor: "black", hairStyle: "curly", top: "green" },
  EG: { skin: "olive", hairColor: "darkbrown", hairStyle: "long", top: "red" },
  BR: { skin: "tan", hairColor: "darkbrown", hairStyle: "curly", top: "yellow" },
  PE: { skin: "olive", hairColor: "black", hairStyle: "braids", top: "red" },
  MX: { skin: "tan", hairColor: "black", hairStyle: "long", top: "orange" },
  IS: { skin: "porcelain", hairColor: "blonde", hairStyle: "long", top: "blue" },
  IT: { skin: "fair", hairColor: "brown", hairStyle: "bob", top: "green" },
  AU: { skin: "fair", hairColor: "blonde", hairStyle: "bun", top: "purple" },
};

function otherThan<T>(all: T[], own: T, n: number, offset: number): T[] {
  const rest = [...new Set(all)].filter((x) => x !== own);
  return Array.from({ length: n }, (_, i) => rest[(offset + i) % rest.length]);
}

/**
 * A plain deck built from the bundled facts, used when no API key is configured.
 * The wording is the same for every age; only the Claude-written decks adapt to the child.
 */
export function sampleDraft(country: Country, guideGender: Gender): DeckDraft {
  const c = country;
  const name = c.guideNames[guideGender];
  const hello = c.words[0].word;
  const index = COUNTRIES.findIndex((x) => x.code === c.code);
  const capitals = COUNTRIES.map((x) => x.capital);
  const languages = COUNTRIES.map((x) => x.languages[0]);
  const continents = [...new Set(COUNTRIES.map((x) => x.continent))];
  const look = LOOKS[c.code] ?? LOOKS.JP;

  return {
    guide: {
      name,
      town: c.town,
      ...look,
      hairStyle: guideGender === "boy" ? "short" : look.hairStyle,
      glasses: false,
    },
    cards: {
      hello: {
        title: `${hello}! I'm ${name}`,
        text: `I live in ${c.town}, in ${c.name}. A famous sight in my country is ${c.landmark}. Come on, I'll show you around!`,
      },
      where: {
        title: `Find ${c.name} on the globe`,
        text: `${c.name} is in ${c.continent}. It is ${c.location}. ${c.population[0].toUpperCase() + c.population.slice(1)} people live here.`,
      },
      capital: {
        title: c.capital,
        text: `Our capital city is ${c.capital}. That is where the government of ${c.name} works. We pay with the ${c.currency}.`,
      },
      language: {
        title: `We speak ${c.languages[0]}`,
        text: `In ${c.name} people speak ${c.languages.join(", ")}. Try saying these words out loud!`,
        words: c.words.map((w) => ({ ...w })),
      },
      food: {
        title: "What I eat",
        text: `In my family we love ${c.dish}. Not every family in ${c.name} eats the same things as mine.`,
        question: "What is your favourite thing to eat?",
      },
      day: {
        title: "A school day with me",
        text: "This is what a normal school day looks like for me. Other children here have different days.",
        timeline: [
          { time: "7:00", what: "Breakfast with my family" },
          { time: "8:00", what: "School starts" },
          { time: "12:30", what: "Lunch with my friends" },
          { time: "16:00", what: "Playing outside" },
          { time: "20:30", what: "Bedtime" },
        ],
        question: "What time does your school start?",
      },
      celebrate: {
        title: "What we believe and celebrate",
        text: `The main religions in ${c.name} are ${c.religions.join(", ")}. Something I look forward to is ${c.festival}.`,
      },
      play: {
        title: "Play and animals",
        text: `After school I play with my friends. An animal that lives in ${c.name} is ${c.animal}.`,
      },
      didYouKnow: { title: "Did you know?", text: c.funFact },
      yourTurn: {
        title: "Now you show me!",
        text: "If I came to visit you, what is the first thing you would show me where you live?",
      },
    },
    photoSubjects: { ...c.photos },
    quiz: [
      {
        question: `What is the capital of ${c.name}?`,
        correct: c.capital,
        wrong: otherThan(capitals, c.capital, 2, index),
        hint: "Look at the card called “Our capital”.",
      },
      {
        question: `Which language does ${name} speak?`,
        correct: c.languages[0],
        wrong: otherThan(languages, c.languages[0], 2, index + 3),
        hint: "Look at the card called “How we talk”.",
      },
      {
        question: `How do you say “${c.words[0].meaning}” in ${c.name}?`,
        correct: c.words[0].word,
        wrong: otherThan(
          COUNTRIES.map((x) => x.words[0].word),
          c.words[0].word,
          2,
          index + 1,
        ),
        hint: `It is the first thing ${name} said to you.`,
      },
      {
        question: `On which continent is ${c.name}?`,
        correct: c.continent,
        wrong: otherThan(continents, c.continent, 2, index),
        hint: "Look at the globe card.",
      },
    ],
    review: [
      {
        question: `Which city is the capital of ${c.name}?`,
        correct: c.capital,
        wrong: otherThan(capitals, c.capital, 2, index + 4),
        hint: `${name} told you about it on the “Our capital” card.`,
      },
      {
        question: `What do people in ${c.name} pay with?`,
        correct: c.currency,
        wrong: otherThan(
          COUNTRIES.map((x) => x.currency),
          c.currency,
          2,
          index + 2,
        ),
        hint: "It was on the “Our capital” card.",
      },
    ],
  };
}
