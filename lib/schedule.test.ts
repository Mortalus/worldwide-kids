import { describe, expect, it } from "vitest";
import { decide, startOfWeek, weekday, type Visit } from "./schedule";

// 2026-10-05 is a Monday.
const MON = "2026-10-05";
const TUE = "2026-10-06";
const WED = "2026-10-07";
const MWF = [0, 2, 4];

const done = (code: string, on: string, reviewedOn: string | null = null): Visit => ({
  code,
  status: "done",
  unlockedOn: on,
  completedOn: on,
  reviewedOn,
});

describe("calendar helpers", () => {
  it("treats Monday as the first day of the week", () => {
    expect(weekday(MON)).toBe(0);
    expect(weekday("2026-10-11")).toBe(6);
    expect(startOfWeek("2026-10-11")).toBe(MON);
  });
});

describe("decide", () => {
  it("gives a first country straight away, whatever the day", () => {
    expect(decide([], MWF, TUE, 10)).toEqual({ kind: "new" });
  });

  it("returns to an unfinished country", () => {
    const v: Visit = { code: "JP", status: "active", unlockedOn: MON, completedOn: null, reviewedOn: null };
    expect(decide([v], MWF, WED, 10)).toEqual({ kind: "country", code: "JP" });
  });

  it("does not hand out a second country on the same day", () => {
    expect(decide([done("JP", MON)], MWF, MON, 10)).toEqual({ kind: "wait", nextDay: WED });
  });

  it("keeps a missed scheduled day available on the next day", () => {
    // Last country on Friday, Monday missed, child opens the app on Tuesday.
    const visits = [done("JP", "2026-10-02", "2026-10-05")];
    expect(decide(visits, MWF, TUE, 10)).toEqual({ kind: "new" });
  });

  it("missed days do not stack: after catching up, the child waits", () => {
    const visits = [done("JP", "2026-10-02", "2026-10-05"), done("BR", TUE)];
    expect(decide(visits, MWF, TUE, 10)).toEqual({ kind: "wait", nextDay: WED });
  });

  it("asks for a review of last week's countries before anything new", () => {
    const visits = [done("JP", "2026-09-28"), done("BR", "2026-09-30")];
    expect(decide(visits, MWF, MON, 10)).toEqual({ kind: "review", codes: ["JP", "BR"] });
  });

  it("does not review countries finished this week", () => {
    expect(decide([done("JP", MON)], MWF, WED, 10)).toEqual({ kind: "new" });
  });

  it("still reviews after a whole week was skipped", () => {
    const visits = [done("JP", "2026-09-14")];
    expect(decide(visits, MWF, MON, 10)).toEqual({ kind: "review", codes: ["JP"] });
  });

  it("waits with no date when no days are scheduled", () => {
    expect(decide([done("JP", MON)], [], WED, 10)).toEqual({ kind: "wait", nextDay: null });
  });

  it("is finished once every country is done and reviewed", () => {
    const visits = [done("JP", "2026-09-28", MON), done("BR", "2026-09-30", MON)];
    expect(decide(visits, MWF, WED, 2)).toEqual({ kind: "finished" });
  });
});
