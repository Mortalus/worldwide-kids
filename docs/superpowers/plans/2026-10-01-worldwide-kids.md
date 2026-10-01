# Worldwide Kids Implementation Plan

**Goal:** A local family web app where each child gets a new country on scheduled days, told by a guide child on photo cards, followed by a quiz, a passport stamp and a weekly review.

**Architecture:** Next.js App Router with server actions. Pure logic (schedule, picker, licence filter, content validation) lives in `lib/` with unit tests. Data is one SQLite file accessed through `lib/db.ts`. Each deck is generated once and stored as JSON on the child's country row.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind 4, `node:sqlite`, `@anthropic-ai/sdk` + zod (model `claude-opus-5-5`), d3-geo + world-atlas for maps, Wikimedia Commons API for photos, vitest.

**Spec:** `docs/superpowers/specs/2026-10-01-worldwide-kids-design.md`

**Execution:** native, in the brainstorming session, at the user's instruction ("Build it for 10 countries").

## Global constraints

- Ages 5 to 14 only. Weeks start Monday.
- 10 countries: JP, IN, KE, EG, BR, PE, MX, IS, IT, AU.
- Photos: public domain, CC0, CC BY, CC BY-SA only; every photo shows author, licence link and source link.
- Review passes by finishing; retries are free.
- The API key is used only on the server. Without a key the app runs in labelled sample mode.

## Review focus

1. Child opens the app on a non-scheduled day after missing a scheduled one: the country is still waiting (test in `schedule.test.ts`).
2. Child finishes a country and reopens the app the same day: no second country (test).
3. A week is skipped entirely: the review still covers the unreviewed countries (test).
4. Claude returns the wrong number of questions or cards: nothing is saved, error shown (test in `content.test.ts`).
5. A photo has a non-commercial or missing licence: the card falls back to no photo (test in `images.test.ts`).

## Tasks

- [ ] **1. Facts** `data/countries.ts`: the ten countries with capital, languages, religions, population, currency, continent, ISO numeric id for the map, hello phrase, sample-mode details and default photo subjects.
- [ ] **2. Schedule** `lib/schedule.ts` + `lib/schedule.test.ts`: `decide(state, now)` returns `country | review | new | wait | finished`; `startOfWeek`, `nextScheduledDay`.
- [ ] **3. Picker** `lib/picker.ts` + test: `pickCountry(visited, lastContinent, rand)`.
- [ ] **4. Images** `lib/images.ts` + test: `isAllowedLicence`, `findPhoto(subject)` returning url, author, licence, licenceUrl, sourceUrl or null.
- [ ] **5. Content** `lib/content.ts`, `lib/sample.ts` + test: zod schema, prompt, `generateDeck(child, country, guideGender, client?)`, `checkDeck`, sample-mode builder.
- [ ] **6. Database** `lib/db.ts`: tables `children`, `child_countries`, `reviews`, `settings`; query helpers.
- [ ] **7. Actions** `lib/actions.ts`: unlock country, complete quiz, complete review, child CRUD, PIN set/check.
- [ ] **8. Components** `components/`: `GuideAvatar`, `Globe`, `WorldMap`, `Deck`, `Quiz`, `PhotoCredit`.
- [ ] **9. Screens** `app/`: home, kid hub, country deck, quiz, review, passport, parents.
- [ ] **10. Verify**: `npm test`, `npm run build`, then a browser pass through the whole flow including a simulated week change.
