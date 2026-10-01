import { notFound } from "next/navigation";
import { Quiz } from "@/components/Quiz";
import { KidHeader } from "@/components/ui";
import { getCountry } from "@/data/countries";
import { finishQuiz } from "@/lib/actions";
import { getChild, getVisit } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ id: string; code: string }> }) {
  const { id, code } = await params;
  const child = getChild(Number(id));
  const country = getCountry(code);
  const visit = child && getVisit(child.id, code);
  if (!child || !country || !visit) notFound();

  const { guide, cards, quiz } = visit.deck;
  return (
    <>
      <KidHeader childId={child.id} avatar={child.avatar} name={child.name} />
      <Quiz
        heading="Quiz"
        finishLabel="Get my stamp! →"
        onFinish={finishQuiz.bind(null, child.id, code)}
        items={quiz.map((q) => ({
          ...q,
          guide: { name: guide.name, avatar: guide.avatar },
          countryLabel: `${country.flag} ${country.name}`,
          peek: cards.map((c) => ({ title: c.title, text: c.text })),
        }))}
      />
    </>
  );
}
