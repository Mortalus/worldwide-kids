import Link from "next/link";
import { notFound } from "next/navigation";
import { KidHeader, primaryButton, SubmitButton } from "@/components/ui";
import { COUNTRIES, getCountry } from "@/data/countries";
import { startNewCountry } from "@/lib/actions";
import { getChild, listVisits } from "@/lib/db";
import { decide, today, weekday, WEEKDAY_NAMES } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function KidHub({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ problem?: string; reviewed?: string }>;
}) {
  const child = getChild(Number((await params).id));
  if (!child) notFound();
  const { problem, reviewed } = await searchParams;
  const visits = listVisits(child.id);
  const decision = decide(visits, child.weekdays, today(), COUNTRIES.length);
  const panel = "rounded-3xl bg-white p-7 text-center shadow-[0_4px_0_#e9dcc3]";

  return (
    <>
      <KidHeader childId={child.id} avatar={child.avatar} name={child.name} />

      {problem && (
        <p role="alert" className="mb-4 rounded-2xl bg-[#fff4df] px-4 py-3 font-bold">
          We couldn&apos;t load today&apos;s country. Please ask a grown-up to have a look.
        </p>
      )}
      {reviewed && <p className="mb-4 rounded-2xl bg-[#e7f7ef] px-4 py-3 font-bold text-[#1f7650]">Review done. Great remembering! 🎉</p>}

      {decision.kind === "country" && (
        <section className={panel}>
          <p className="text-6xl">{getCountry(decision.code)?.flag}</p>
          <h1 className="mt-3 text-3xl font-extrabold">{getCountry(decision.code)?.name} is waiting for you</h1>
          <Link href={`/kid/${child.id}/country/${decision.code}`} className={`${primaryButton} mt-5`}>
            Keep exploring →
          </Link>
        </section>
      )}

      {decision.kind === "review" && (
        <section className={panel}>
          <h1 className="text-3xl font-extrabold">Welcome back, {child.name}!</h1>
          <p className="mt-2 text-lg">You visited:</p>
          <p className="mt-2 text-5xl tracking-widest">{decision.codes.map((c) => getCountry(c)?.flag).join(" ")}</p>
          <p className="mt-3 text-lg">Let&apos;s see what you remember before we fly somewhere new.</p>
          <Link href={`/kid/${child.id}/review`} className={`${primaryButton} mt-5`}>
            Start the review →
          </Link>
          <p className="mt-5 rounded-2xl bg-[#e6ebf5] px-4 py-3 font-bold text-slate-500">🔒 Your next country unlocks after the review</p>
        </section>
      )}

      {decision.kind === "new" && (
        <section className={panel}>
          <p className="text-6xl">✈️</p>
          <h1 className="mt-3 text-3xl font-extrabold">A new country is ready!</h1>
          <p className="mt-2 text-lg">Somebody there can&apos;t wait to meet you.</p>
          <form action={startNewCountry.bind(null, child.id)} className="mt-5">
            <SubmitButton pendingText="Packing your suitcase… 🧳">Let&apos;s go! →</SubmitButton>
          </form>
        </section>
      )}

      {decision.kind === "wait" && (
        <section className={panel}>
          <p className="text-6xl">🗓️</p>
          <h1 className="mt-3 text-3xl font-extrabold">
            {decision.nextDay ? `Your next country arrives on ${WEEKDAY_NAMES[weekday(decision.nextDay)]}` : "No travel days are set yet"}
          </h1>
          <p className="mt-2 text-lg">Until then, visit your passport and read your countries again.</p>
          <Link href={`/kid/${child.id}/passport`} className={`${primaryButton} mt-5`}>
            Open my passport
          </Link>
        </section>
      )}

      {decision.kind === "finished" && (
        <section className={panel}>
          <p className="text-6xl">🏆</p>
          <h1 className="mt-3 text-3xl font-extrabold">You have visited every country!</h1>
          <Link href={`/kid/${child.id}/passport`} className={`${primaryButton} mt-5`}>
            Open my passport
          </Link>
        </section>
      )}
    </>
  );
}
