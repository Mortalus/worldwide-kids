import { notFound, redirect } from "next/navigation";
import { Quiz } from "@/components/Quiz";
import { KidHeader } from "@/components/ui";
import { getCountry } from "@/data/countries";
import { finishReview } from "@/lib/actions";
import { getChild, listVisits } from "@/lib/db";
import { reviewDue, today } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const child = getChild(Number((await params).id));
  if (!child) notFound();
  const visits = listVisits(child.id);
  const due = reviewDue(visits, today());
  if (due.length === 0) redirect(`/kid/${child.id}`);

  const items = visits
    .filter((v) => due.includes(v.code))
    .flatMap((v) => {
      const country = getCountry(v.code)!;
      return v.deck.review.map((q) => ({
        ...q,
        guide: { name: v.deck.guide.name, avatar: v.deck.guide.avatar },
        countryLabel: `${country.flag} ${country.name}`,
        peek: v.deck.cards.map((c) => ({ title: c.title, text: c.text })),
      }));
    });

  return (
    <>
      <KidHeader childId={child.id} avatar={child.avatar} name={child.name} />
      <Quiz heading="Review" finishLabel="Finish the review →" onFinish={finishReview.bind(null, child.id)} items={items} />
    </>
  );
}
