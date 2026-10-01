export type Photo = {
  url: string;
  author: string;
  licence: string;
  licenceUrl: string | null;
  sourceUrl: string;
};

// Wikimedia asks API clients to identify themselves; a contact address raises the rate limit.
const UA = `worldwide-kids/0.1 (family learning app${process.env.WK_CONTACT_EMAIL ? `; ${process.env.WK_CONTACT_EMAIL}` : ""})`;

/** Only licences that allow reuse with credit: public domain, CC0, CC BY, CC BY-SA. */
export function isAllowedLicence(shortName: string): boolean {
  return /^(public domain|pd\b|cc0|cc by(-sa)? \d)/i.test(shortName.trim());
}

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatAuthor(artistHtml: string | undefined): string {
  const text = plain(artistHtml ?? "");
  if (!text) return "Unknown author";
  return text.length > 80 ? text.slice(0, 77) + "…" : text;
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
type Options = { fetchFn?: Fetch; wait?: (ms: number) => Promise<void> };

async function getJson(base: string, params: Record<string, string>, { fetchFn = fetch, wait = sleep }: Options) {
  const url = `${base}?${new URLSearchParams({ ...params, format: "json", action: "query" })}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetchFn(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    if (res.ok) return res.json();
    // Wikimedia rate-limits bursts and says how long to wait; one patient retry.
    if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
      const seconds = Number(res.headers.get("retry-after")) || 2;
      await wait(Math.min(seconds, 30) * 1000);
      continue;
    }
    throw new Error(`Wikimedia returned ${res.status}`);
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Follows the API's "normalized" and "redirects" lists from the title we asked for to the one it answered with. */
function resolveTitle(query: any, title: string): string {
  for (const list of [query?.normalized, query?.redirects]) {
    const hit = (list ?? []).find((n: { from: string; to: string }) => n.from === title);
    if (hit) title = hit.to;
  }
  return title;
}

/**
 * Lead images of several Wikipedia articles, each with the attribution Wikimedia Commons records for it.
 * Two requests in total, however many subjects. A subject maps to null when its article has no image,
 * the image is not on Commons, or its licence is not allowed. Never throws.
 */
export async function findPhotos(subjects: string[], options: Options = {}): Promise<Record<string, Photo | null>> {
  const result: Record<string, Photo | null> = Object.fromEntries(subjects.map((s) => [s, null]));
  if (subjects.length === 0) return result;
  try {
    const pages = await getJson(
      "https://en.wikipedia.org/w/api.php",
      { titles: subjects.join("|"), prop: "pageimages", piprop: "name", redirects: "1" },
      options,
    );
    const byTitle = new Map<string, string>();
    for (const page of Object.values(pages?.query?.pages ?? {}) as { title: string; pageimage?: string }[]) {
      if (page.pageimage) byTitle.set(page.title, page.pageimage);
    }
    const fileOf = new Map<string, string>();
    for (const subject of subjects) {
      const file = byTitle.get(resolveTitle(pages?.query, subject));
      if (file) fileOf.set(subject, `File:${file}`);
    }
    if (fileOf.size === 0) return result;

    const info = await getJson(
      "https://commons.wikimedia.org/w/api.php",
      { titles: [...new Set(fileOf.values())].join("|"), prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "960" },
      options,
    );
    const infoByTitle = new Map<string, any>();
    for (const page of Object.values(info?.query?.pages ?? {}) as { title: string; imageinfo?: any[] }[]) {
      if (page.imageinfo?.[0]) infoByTitle.set(page.title, page.imageinfo[0]);
    }

    for (const [subject, file] of fileOf) {
      const ii = infoByTitle.get(resolveTitle(info?.query, file));
      if (!ii?.thumburl || !ii?.descriptionurl) continue;
      const meta = ii.extmetadata ?? {};
      const licence = plain(meta.LicenseShortName?.value ?? "");
      if (!isAllowedLicence(licence)) continue;
      result[subject] = {
        url: ii.thumburl,
        author: formatAuthor(meta.Artist?.value),
        licence,
        licenceUrl: meta.LicenseUrl?.value || null,
        sourceUrl: ii.descriptionurl,
      };
    }
  } catch (error) {
    console.error("Photo lookup failed:", error);
  }
  return result;
}
