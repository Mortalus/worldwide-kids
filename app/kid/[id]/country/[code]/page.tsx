import { notFound } from "next/navigation";
import { Deck } from "@/components/Deck";
import { Globe, MAP_CREDIT } from "@/components/Maps";
import { KidHeader } from "@/components/ui";
import { getCountry } from "@/data/countries";
import { hasApiKey } from "@/lib/content";
import { getChild, getVisit, replaceDeck } from "@/lib/db";
import { makeDeck, refillPhotos } from "@/lib/decks";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: Promise<{ id: string; code: string }> }) {
  const { id, code } = await params;
  const child = getChild(Number(id));
  const country = getCountry(code);
  let visit = child && getVisit(child.id, code);
  if (!child || !country || !visit) notFound();

  // A deck made in sample mode is rewritten by Claude the first time it is opened with a key.
  if (visit.source === "sample" && hasApiKey()) {
    try {
      const made = await makeDeck(child, country, visit.deck.guide.gender);
      replaceDeck(child.id, code, made.source, made.deck);
      visit = { ...visit, ...made };
    } catch (error) {
      console.error("Could not upgrade sample lesson:", error);
    }
  }

  const repaired = await refillPhotos(visit.deck, country);
  if (repaired) {
    replaceDeck(child.id, code, visit.source, repaired);
    visit = { ...visit, deck: repaired };
  }

  return (
    <>
      <KidHeader childId={child.id} avatar={child.avatar} name={child.name} />
      <p className="mb-3 text-center text-lg font-extrabold">
        {country.flag} {country.name} · with {visit.deck.guide.name} from {visit.deck.guide.town}
      </p>
      <Deck
        deck={visit.deck}
        mapSlot={<Globe mapId={country.mapId} name={country.name} />}
        mapCredit={MAP_CREDIT}
        doneHref={visit.status === "active" ? `/kid/${child.id}/country/${code}/quiz` : `/kid/${child.id}/passport`}
        doneLabel={visit.status === "active" ? "I'm ready for the quiz →" : "Back to my passport"}
      />
    </>
  );
}
