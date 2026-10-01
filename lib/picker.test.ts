import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@/data/countries";
import { pickCountry } from "./picker";

describe("pickCountry", () => {
  it("never repeats a country", () => {
    const visited = COUNTRIES.slice(0, 9).map((c) => c.code);
    expect(pickCountry(visited, null)?.code).toBe(COUNTRIES[9].code);
  });

  it("returns null when every country has been visited", () => {
    expect(pickCountry(COUNTRIES.map((c) => c.code), null)).toBeNull();
  });

  it("prefers a different continent from the last one", () => {
    for (let i = 0; i < 20; i++) {
      expect(pickCountry(["JP"], "Asia", () => i / 20)?.continent).not.toBe("Asia");
    }
  });

  it("falls back to the same continent when nothing else is left", () => {
    const visited = COUNTRIES.filter((c) => c.code !== "IN").map((c) => c.code);
    expect(pickCountry(visited, "Asia")?.code).toBe("IN");
  });
});
