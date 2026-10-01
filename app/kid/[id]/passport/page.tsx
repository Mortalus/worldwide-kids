import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideAvatar } from "@/components/GuideAvatar";
import { MAP_CREDIT, WorldMap } from "@/components/Maps";
import { KidHeader } from "@/components/ui";
import { COUNTRIES, getCountry } from "@/data/countries";
import { getChild, listVisits } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PassportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stamp?: string }>;
}) {
  const child = getChild(Number((await params).id));
  if (!child) notFound();
  const { stamp } = await searchParams;
  const done = listVisits(child.id).filter((v) => v.status === "done");
  const countries = done.map((v) => getCountry(v.code)!);
  const continents = new Set(countries.map((c) => c.continent)).size;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <>
      <KidHeader childId={child.id} avatar={child.avatar} name={child.name} />
      <section className="rounded-3xl bg-white p-6 shadow-[0_4px_0_#e9dcc3]">
        <h1 className="text-3xl font-extrabold">{child.name}&apos;s passport</h1>
        <p className="text-slate-500">
          {plural(done.length, "country", "countries")} · {plural(continents, "continent", "continents")}
        </p>
        {stamp && getCountry(stamp) && (
          <p className="mt-3 rounded-2xl bg-[#e7f7ef] px-4 py-3 text-lg font-extrabold text-[#1f7650]">
            New stamp: {getCountry(stamp)!.name}! 🎉
          </p>
        )}

        <ul className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-5">
          {done.map((v, i) => (
            <li key={v.code}>
              <Link href={`/kid/${child.id}/country/${v.code}`} className="block text-center">
                <span
                  className={`relative mx-auto grid h-20 w-20 -rotate-6 place-items-center rounded-full border-[3px] border-dashed border-[#c05a3c] text-4xl ${v.code === stamp ? "stamp-new" : ""}`}
                >
                  {countries[i].flag}
                  <span className="absolute -bottom-2 -right-2 rotate-6">
                    <GuideAvatar avatar={v.deck.guide.avatar} size={30} label={v.deck.guide.name} />
                  </span>
                </span>
                <span className="mt-2 block text-sm font-extrabold">{countries[i].name}</span>
                <span className="block text-xs text-slate-500">with {v.deck.guide.name}</span>
              </Link>
            </li>
          ))}
          {Array.from({ length: COUNTRIES.length - done.length }, (_, i) => (
            <li key={`empty-${i}`} className="text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-[3px] border-dashed border-[#d5cbb6] text-2xl text-[#d5cbb6]">?</span>
            </li>
          ))}
        </ul>
        {done.length > 0 && <p className="mt-4 text-sm text-slate-500">Tap a stamp to read that country again.</p>}

        <div className="mt-6 overflow-hidden rounded-2xl">
          <WorldMap visitedIds={countries.map((c) => c.mapId)} />
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{MAP_CREDIT}</p>
      </section>
      <p className="mt-6 text-center">
        <Link href={`/kid/${child.id}`} className="font-bold underline">
          ← Back to today
        </Link>
      </p>
    </>
  );
}
