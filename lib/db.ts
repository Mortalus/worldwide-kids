import { DatabaseSync } from "node:sqlite";
import type { Gender, StoredDeck } from "./content";
import type { Day, Visit } from "./schedule";

const g = globalThis as { __wkDb?: DatabaseSync };

function db(): DatabaseSync {
  if (!g.__wkDb) {
    const d = new DatabaseSync(process.env.WK_DB || "worldwide-kids.db");
    d.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS children (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        age_set_on TEXT NOT NULL,
        gender TEXT NOT NULL,
        avatar TEXT NOT NULL,
        weekdays TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS child_countries (
        id INTEGER PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        status TEXT NOT NULL,
        unlocked_on TEXT NOT NULL,
        completed_on TEXT,
        reviewed_on TEXT,
        source TEXT NOT NULL,
        deck TEXT NOT NULL,
        quiz_first_try INTEGER,
        UNIQUE (child_id, code)
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        done_on TEXT NOT NULL,
        codes TEXT NOT NULL,
        first_try INTEGER NOT NULL,
        total INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    g.__wkDb = d;
  }
  return g.__wkDb;
}

export type Child = {
  id: number;
  name: string;
  age: number;
  ageSetOn: Day;
  gender: Gender;
  avatar: string;
  weekdays: number[];
};
export type ChildInput = Omit<Child, "id" | "ageSetOn">;

export type CountryVisit = Visit & {
  source: "ai" | "sample";
  deck: StoredDeck;
  quizFirstTry: number | null;
};

export type Review = { doneOn: Day; codes: string[]; firstTry: number; total: number };

const toChild = (r: any): Child => ({
  id: r.id,
  name: r.name,
  age: r.age,
  ageSetOn: r.age_set_on,
  gender: r.gender,
  avatar: r.avatar,
  weekdays: JSON.parse(r.weekdays),
});

const toVisit = (r: any): CountryVisit => ({
  code: r.code,
  status: r.status,
  unlockedOn: r.unlocked_on,
  completedOn: r.completed_on,
  reviewedOn: r.reviewed_on,
  source: r.source,
  deck: JSON.parse(r.deck),
  quizFirstTry: r.quiz_first_try,
});

export function listChildren(): Child[] {
  return db().prepare("SELECT * FROM children ORDER BY id").all().map(toChild);
}

export function getChild(id: number): Child | null {
  const row = db().prepare("SELECT * FROM children WHERE id = ?").get(id);
  return row ? toChild(row) : null;
}

export function createChild(c: ChildInput, on: Day): void {
  db()
    .prepare("INSERT INTO children (name, age, age_set_on, gender, avatar, weekdays) VALUES (?, ?, ?, ?, ?, ?)")
    .run(c.name, c.age, on, c.gender, c.avatar, JSON.stringify(c.weekdays));
}

export function updateChild(id: number, c: ChildInput, on: Day): void {
  const before = getChild(id);
  if (!before) return;
  db()
    .prepare("UPDATE children SET name = ?, age = ?, age_set_on = ?, gender = ?, avatar = ?, weekdays = ? WHERE id = ?")
    .run(c.name, c.age, c.age === before.age ? before.ageSetOn : on, c.gender, c.avatar, JSON.stringify(c.weekdays), id);
}

export function deleteChild(id: number): void {
  db().prepare("DELETE FROM children WHERE id = ?").run(id);
}

/** In the order the child met them. */
export function listVisits(childId: number): CountryVisit[] {
  return db().prepare("SELECT * FROM child_countries WHERE child_id = ? ORDER BY id").all(childId).map(toVisit);
}

export function getVisit(childId: number, code: string): CountryVisit | null {
  const row = db().prepare("SELECT * FROM child_countries WHERE child_id = ? AND code = ?").get(childId, code);
  return row ? toVisit(row) : null;
}

export function insertVisit(childId: number, code: string, on: Day, source: "ai" | "sample", deck: StoredDeck): void {
  db()
    .prepare("INSERT INTO child_countries (child_id, code, status, unlocked_on, source, deck) VALUES (?, ?, 'active', ?, ?, ?)")
    .run(childId, code, on, source, JSON.stringify(deck));
}

export function replaceDeck(childId: number, code: string, source: "ai" | "sample", deck: StoredDeck): void {
  db()
    .prepare("UPDATE child_countries SET source = ?, deck = ? WHERE child_id = ? AND code = ?")
    .run(source, JSON.stringify(deck), childId, code);
}

export function completeVisit(childId: number, code: string, on: Day, firstTry: number): void {
  db()
    .prepare(
      "UPDATE child_countries SET status = 'done', completed_on = ?, quiz_first_try = ? WHERE child_id = ? AND code = ? AND status = 'active'",
    )
    .run(on, firstTry, childId, code);
}

export function recordReview(childId: number, codes: string[], on: Day, firstTry: number, total: number): void {
  const d = db();
  const mark = d.prepare("UPDATE child_countries SET reviewed_on = ? WHERE child_id = ? AND code = ?");
  for (const code of codes) mark.run(on, childId, code);
  d.prepare("INSERT INTO reviews (child_id, done_on, codes, first_try, total) VALUES (?, ?, ?, ?, ?)").run(
    childId,
    on,
    JSON.stringify(codes),
    firstTry,
    total,
  );
}

export function listReviews(childId: number): Review[] {
  return db()
    .prepare("SELECT * FROM reviews WHERE child_id = ? ORDER BY id DESC")
    .all(childId)
    .map((r: any) => ({ doneOn: r.done_on, codes: JSON.parse(r.codes), firstTry: r.first_try, total: r.total }));
}

export function getSetting(key: string): string | null {
  const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").run(key, value);
}

export function deleteSetting(key: string): void {
  db().prepare("DELETE FROM settings WHERE key = ?").run(key);
}
