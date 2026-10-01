# Worldwide Kids: design

Date: 2026-10-01
Status: awaiting review

## Purpose

A family app where children aged 5 to 14 learn about one new country at a time, on a schedule their parent sets. Each country is a deck of photo cards written for that child's age, followed by a quiz and a passport stamp. Each new week starts with a review of the previous week's countries.

Success means: a parent can add several children, set how often each gets a new country, and each child can open the app on the shared device, read their country, pass the quiz and see their passport grow.

## Decisions made with the user

- Content: hard facts come from a fixed dataset; Claude writes the kid-facing text and quiz per child.
- Engagement: read, then quiz, then passport stamp.
- Devices: one shared device, no login, local database, parent area behind a PIN.
- Country page: swipeable cards, one at a time, each with a real photo and a visible credit.
- Weekly review: required before the week's first new country. Passing means finishing it; wrong answers can simply be retried. No score threshold.

- Guide child: every country is introduced by a made-up child from that country (see "Guide child").
- Version 1 covers 10 countries: Japan, India, Kenya, Egypt, Brazil, Peru, Mexico, Iceland, Italy, Australia. This replaces the 193-country pool and the external datasets mentioned below: the facts for these ten are a hand-written file in the project, including a default photo subject per card.
- Sample mode: when no Anthropic API key is configured, decks are built from fixed sentence templates over the same facts, and the home and parent screens say so. Sample decks are replaced by Claude-written ones the next time they are opened once a key is present.
- Guide avatar: drawn in the app from parts (option A).

## Assumption not yet confirmed

- Boy/girl on the profile is used only for pronouns in generated text and for the avatar choices. It does not change which facts or topics a child sees.

## Out of scope for version 1

Accounts and sync across devices, languages other than English, notifications or reminders, audio narration, parent-editable content, deployment to a host.

## Screens

1. **Home.** "Who's exploring today?" with each child's avatar and a status: "New country!", "Review time!", or "Next: Thursday". A small "Parents" link.
2. **Weekly review.** Shown on the first visit after a week with completed countries. Lists those countries, then asks 2 questions per country. A wrong answer shows a hint and lets the child retry, with a button to look at that country's card again. Finishing every question unlocks the new country.
3. **Country deck.** A guide child from that country (see "Guide child") narrates the deck in the first person. Ten cards in fixed order: Hello, I'm ... (name, age, where they live, how to say hello); Where I live (map); Our capital; How we talk (language, plus three words to try saying); What I eat; My day (a short timeline from waking up to bedtime); What we believe and celebrate (religion and one festival); Play and animals; Did you know?; Your turn (one open question with no right answer, for the child to think about or talk over with a parent, such as "What would you show me in your town?"). Each card has the guide's avatar and speech text, an image, a tag, a title and a credit line. Next and back buttons, swipe on touch, progress dots.
4. **Country quiz.** 4 multiple-choice questions with 3 answers each. Wrong answers show a hint and allow retry. Completing it awards the stamp.
5. **Passport.** One stamp per completed country, a world map with visited countries coloured, counts of countries and continents. Tapping a stamp reopens that deck.
6. **Parents.** PIN entry, then: list of children; add, edit, remove a child (name, age 5 to 14, boy/girl, avatar); schedule per child (times per week 1 to 7, and which weekdays); progress per child (countries done, first-try quiz results, review results, which countries needed a retry).

## Rules

**Schedule.** Each child has a set of weekdays. Weeks start on Monday. A new country becomes available on a scheduled day if the child has no unfinished country. Missed days do not pile up: at most one country is waiting at a time.

**Country choice.** Picked at random from countries the child has not had, preferring a different continent from the previous one. The pool is the 193 UN member states. A child never gets the same country twice.

**Review gate.** When a child opens the app and has completed countries since their last review that belong to an earlier week, the review must be finished before a new country unlocks. A skipped week does not lose the review: it covers everything since the last one. A child with no countries to review goes straight to the new country.

**Completion.** A country counts as completed when its quiz is finished. First-try correctness is recorded for the parent view but never blocks the child.

**Age.** Stored as birth year and month would be more accurate, but the user asked for age; version 1 stores age and the date it was set, and shows the parent a nudge to update it after 12 months.

## Content

**Facts (not AI).** A bundled JSON file per country: name, ISO code, capital, continent, official languages, population, currency, neighbours, flag. Source: the open `mledoze/countries` dataset. Main religions come from a bundled table built from archived CIA World Factbook data (public domain). These values are shown as-is and are the only source for quiz answers about capital, language, religion and location.

**Text (AI).** One Claude call per child and country, made when the country unlocks. Input: the facts above, the child's age and pronouns. Output, as validated structured data: the guide child's profile and avatar parts, the text for each of the ten cards, a hello phrase and three words to try, a suggested photo subject per card (for example "Mount Fuji"), 4 country quiz questions and 2 review questions, each with 3 answers, the correct one and a hint. The prompt requires age-appropriate length and vocabulary, a neutral and respectful description of religion, and no content unsuitable for children. The result is saved, so re-reading costs nothing and never changes.

**Guide child.** Each country deck has a fictional child guide, generated in the same Claude call. The guide has a first name common in that country, is the same age as the learner (a peer, not a teacher), and lives in a named town or region. Guides alternate between girls and boys from one country to the next, independent of the learner's profile. Teaching rules the prompt enforces:

- First person and concrete: "I eat", "my school starts at", not "people in Japan eat".
- One child is not a whole country: the guide says "in my family" or "where I live", and at least one card mentions that other children in the country live differently.
- Present-day, everyday life. No national costumes, no stereotypes, no poverty or conflict framing.
- Invite comparison: the food and day cards each end with a question back to the learner ("What do you eat for breakfast?").
- Facts the guide states about capital, language, religion and location must match the bundled dataset.

The Hello card carries a small "made-up character" note so nobody takes the guide for a real child. The guide's avatar is an illustration assembled in the app from a fixed set of drawn parts (skin tone, hair style and colour, everyday top colour, optional glasses or head covering); Claude picks from that list. Photos on the cards stay real and credited; the avatar is never a photo of a real child. The guide reappears next to that country's questions in the quiz and weekly review, and on its passport stamp.

**Failure.** If the call fails or the output does not validate, retry once, then show the child a "we couldn't load today's country, ask a grown-up" screen and show the parent the reason. No half-built deck is ever saved.

**Photos.** For each card's photo subject, look up the lead image of the matching Wikipedia article and read its details from Wikimedia Commons: image URL, author, licence name, licence URL, source page. Accept only public domain, CC0, CC BY and CC BY-SA. Save these with the card. The credit line under every photo shows author, licence (linked) and "Wikimedia Commons" (linked to the source page). If no acceptable image is found, the card uses the flag (Meet the country) or the map instead of an uncredited picture.

**Maps.** Drawn in the app from Natural Earth country shapes (public domain), credited on the map card and passport.

## Architecture

Next.js (App Router, TypeScript) running locally. SQLite database file in the project folder. Units, each with one job:

- `data/countries` : the bundled facts and lookup functions. No dependencies.
- `lib/schedule` : pure functions deciding what a child sees today (review, new country, current country, or wait). Depends only on dates and stored progress.
- `lib/picker` : chooses the next country for a child.
- `lib/content` : builds the prompt, calls Claude, validates the result.
- `lib/images` : finds a photo and its attribution, applies the licence filter.
- `lib/db` : tables and queries. Tables: children, schedules, child_countries (status, completed date), cards (text, image, attribution), questions, answers (first-try result), reviews, settings (PIN hash).
- `app/` : the six screens and the server actions that connect them to the units above.

The Anthropic API key is read from `.env.local` and used only on the server.

The parent PIN keeps children out of settings. It is stored hashed but is a convenience lock, not a security boundary.

## Testing

- Unit tests for `lib/schedule`, `lib/picker` and the review gate, including: missed days, skipped weeks, first-ever visit, all scheduled days in one week, a child with no schedule.
- Unit tests for the image licence filter and the attribution formatting.
- `lib/content` tested with a fake Claude response: valid output, invalid output, failed call.
- One end-to-end pass in the browser: add a child, read a country, finish the quiz, see the stamp, move the clock forward a week, finish the review, unlock the next country.
