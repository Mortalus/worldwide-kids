import { describe, expect, it } from "vitest";
import { findPhotos, formatAuthor, isAllowedLicence } from "./images";

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

const commonsPage = (title: string, licence: string | null) => ({
  title,
  imageinfo: [
    {
      thumburl: `https://upload.wikimedia.org/thumb/${title}`,
      descriptionurl: `https://commons.wikimedia.org/wiki/${title}`,
      extmetadata: {
        Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Ann">Ann &amp; Bo</a>' },
        ...(licence ? { LicenseShortName: { value: licence }, LicenseUrl: { value: "https://l.example" } } : {}),
      },
    },
  ],
});

/** Wikipedia knows "Mount Fuji" and, via a redirect, "Fuji-san"; Commons holds the file under a normalised title. */
function fakeWikimedia(licence: string | null) {
  const calls: string[] = [];
  const fetchFn = async (url: string) => {
    calls.push(url);
    if (url.includes("en.wikipedia.org")) {
      return json({
        query: {
          redirects: [{ from: "Fuji-san", to: "Mount Fuji" }],
          pages: { "1": { title: "Mount Fuji", pageimage: "Fuji_view.jpg" }, "-1": { title: "Nothing here" } },
        },
      });
    }
    return json({
      query: {
        normalized: [{ from: "File:Fuji_view.jpg", to: "File:Fuji view.jpg" }],
        pages: { "-1": commonsPage("File:Fuji view.jpg", licence) },
      },
    });
  };
  return { fetchFn, calls };
}

describe("isAllowedLicence", () => {
  it.each(["CC BY-SA 4.0", "CC BY 2.0", "CC0", "Public domain", "CC BY-SA 3.0 de"])("accepts %s", (l) => {
    expect(isAllowedLicence(l)).toBe(true);
  });
  it.each(["CC BY-NC 2.0", "CC BY-NC-SA 4.0", "CC BY-ND 2.0", "GFDL", "Fair use", ""])("rejects %s", (l) => {
    expect(isAllowedLicence(l)).toBe(false);
  });
});

describe("formatAuthor", () => {
  it("strips markup", () => expect(formatAuthor("<b>Ann</b> &amp; Bo")).toBe("Ann & Bo"));
  it("never returns an empty credit", () => expect(formatAuthor(undefined)).toBe("Unknown author"));
});

describe("findPhotos", () => {
  const fuji = {
    url: "https://upload.wikimedia.org/thumb/File:Fuji view.jpg",
    author: "Ann & Bo",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://l.example",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Fuji view.jpg",
  };

  it("returns each photo with its attribution, in two requests", async () => {
    const { fetchFn, calls } = fakeWikimedia("CC BY-SA 4.0");
    expect(await findPhotos(["Mount Fuji", "Fuji-san", "Nothing here"], { fetchFn })).toEqual({
      "Mount Fuji": fuji,
      "Fuji-san": fuji,
      "Nothing here": null,
    });
    expect(calls).toHaveLength(2);
  });

  it("refuses a non-commercial licence", async () => {
    const { fetchFn } = fakeWikimedia("CC BY-NC 2.0");
    expect(await findPhotos(["Mount Fuji"], { fetchFn })).toEqual({ "Mount Fuji": null });
  });

  it("refuses a photo with no licence recorded", async () => {
    const { fetchFn } = fakeWikimedia(null);
    expect(await findPhotos(["Mount Fuji"], { fetchFn })).toEqual({ "Mount Fuji": null });
  });

  it("waits and retries once when rate-limited", async () => {
    const { fetchFn } = fakeWikimedia("CC0");
    let limited = true;
    const waits: number[] = [];
    const result = await findPhotos(["Mount Fuji"], {
      fetchFn: async (url) => {
        if (limited) {
          limited = false;
          return new Response("slow down", { status: 429, headers: { "retry-after": "3" } });
        }
        return fetchFn(url);
      },
      wait: async (ms) => void waits.push(ms),
    });
    expect(waits).toEqual([3000]);
    expect(result["Mount Fuji"]?.licence).toBe("CC0");
  });

  it("returns nulls instead of throwing when the network fails", async () => {
    const offline = async () => {
      throw new Error("offline");
    };
    expect(await findPhotos(["Mount Fuji"], { fetchFn: offline })).toEqual({ "Mount Fuji": null });
  });
});
