/** A local calendar day as YYYY-MM-DD. Comparing two of them as strings orders them by date. */
export type Day = string;

export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function toDay(d: Date): Day {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function today(): Day {
  return process.env.WK_FAKE_TODAY || toDay(new Date());
}

function parse(day: Day): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(day: Day, n: number): Day {
  const d = parse(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

/** 0 = Monday … 6 = Sunday */
export function weekday(day: Day): number {
  return (parse(day).getDay() + 6) % 7;
}

export function startOfWeek(day: Day): Day {
  return addDays(day, -weekday(day));
}

export type Visit = {
  code: string;
  status: "active" | "done";
  unlockedOn: Day;
  completedOn: Day | null;
  reviewedOn: Day | null;
};

export type Decision =
  | { kind: "country"; code: string }
  | { kind: "review"; codes: string[] }
  | { kind: "new" }
  | { kind: "wait"; nextDay: Day | null }
  | { kind: "finished" };

/** Countries finished in an earlier week that have not been reviewed yet. */
export function reviewDue(visits: Visit[], now: Day): string[] {
  const monday = startOfWeek(now);
  return visits
    .filter((v) => v.status === "done" && !v.reviewedOn && v.completedOn !== null && v.completedOn < monday)
    .map((v) => v.code);
}

function mostRecentScheduled(now: Day, weekdays: number[]): Day | null {
  for (let i = 0; i < 7; i++) {
    const d = addDays(now, -i);
    if (weekdays.includes(weekday(d))) return d;
  }
  return null;
}

export function nextScheduled(now: Day, weekdays: number[]): Day | null {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(now, i);
    if (weekdays.includes(weekday(d))) return d;
  }
  return null;
}

/** What a child sees when they open the app on `now`. */
export function decide(visits: Visit[], weekdays: number[], now: Day, totalCountries: number): Decision {
  const active = visits.find((v) => v.status === "active");
  if (active) return { kind: "country", code: active.code };

  const due = reviewDue(visits, now);
  if (due.length > 0) return { kind: "review", codes: due };

  if (visits.length >= totalCountries) return { kind: "finished" };
  if (visits.length === 0) return { kind: "new" };

  // One country per scheduled day; a missed day stays available but never stacks.
  const lastUnlock = visits.map((v) => v.unlockedOn).sort().at(-1)!;
  const recent = mostRecentScheduled(now, weekdays);
  if (recent && lastUnlock < recent) return { kind: "new" };

  return { kind: "wait", nextDay: nextScheduled(now, weekdays) };
}
