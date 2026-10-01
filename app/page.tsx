import Link from "next/link";
import { COUNTRIES } from "@/data/countries";
import { hasApiKey } from "@/lib/content";
import { listChildren, listVisits } from "@/lib/db";
import { decide, today, weekday, WEEKDAY_NAMES } from "@/lib/schedule";

export const dynamic = "force-dynamic";

function status(childId: number, weekdays: number[]): { text: string; ready: boolean } {
  const decision = decide(listVisits(childId), weekdays, today(), COUNTRIES.length);
  switch (decision.kind) {
    case "new":
      return { text: "New country!", ready: true };
    case "country":
      return { text: "Keep exploring!", ready: true };
    case "review":
      return { text: "Review time!", ready: true };
    case "finished":
      return { text: "All countries visited", ready: false };
    case "wait":
      return { text: decision.nextDay ? `Next: ${WEEKDAY_NAMES[weekday(decision.nextDay)]}` : "No days set", ready: false };
  }
}

export default function Home() {
  const children = listChildren();
  return (
    <div className="text-center">
      <h1 className="text-4xl font-extrabold">🌍 Worldwide Kids</h1>
      {children.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-3xl bg-white p-8 shadow-[0_4px_0_#e9dcc3]">
          <p className="text-xl font-bold">Welcome! Let&apos;s add your first explorer.</p>
          <Link href="/parents" className="mt-5 inline-block rounded-2xl bg-[#2f9e6e] px-6 py-3 text-lg font-extrabold text-white shadow-[0_3px_0_#1f7650]">
            Set up (for parents)
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-xl text-slate-600">Who&apos;s exploring today? Tap your picture.</p>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {children.map((child) => {
              const s = status(child.id, child.weekdays);
              return (
                <li key={child.id}>
                  <Link href={`/kid/${child.id}`} className="block rounded-3xl bg-white p-5 shadow-[0_4px_0_#e9dcc3] hover:-translate-y-0.5">
                    <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#ffe9b8] text-5xl">{child.avatar}</span>
                    <span className="mt-3 block text-xl font-extrabold">{child.name}</span>
                    <span className="block text-sm text-slate-500">{child.age} years</span>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold ${s.ready ? "bg-[#ffd84d]" : "bg-[#e6ebf5] text-slate-500"}`}>
                      {s.text}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {!hasApiKey() && (
        <p className="mx-auto mt-8 max-w-md rounded-2xl bg-[#e6ebf5] px-4 py-2 text-sm text-slate-600">
          Sample mode: lessons use simple built-in text until a parent adds an API key.
        </p>
      )}
      <p className="mt-10">
        <Link href="/parents" className="text-sm font-bold text-slate-500 underline">
          🔒 Parents
        </Link>
      </p>
    </div>
  );
}
