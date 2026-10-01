"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StoredCard, StoredDeck } from "@/lib/content";
import { GuideAvatar } from "./GuideAvatar";

export function PhotoCredit({ photo }: { photo: NonNullable<StoredCard["photo"]> }) {
  return (
    <p className="bg-[#f6efe0] px-4 py-1.5 text-[11px] text-slate-500">
      Photo: {photo.author} ·{" "}
      {photo.licenceUrl ? (
        <a className="underline" href={photo.licenceUrl} target="_blank" rel="noreferrer">
          {photo.licence}
        </a>
      ) : (
        photo.licence
      )}{" "}
      ·{" "}
      <a className="underline" href={photo.sourceUrl} target="_blank" rel="noreferrer">
        Wikimedia Commons
      </a>
    </p>
  );
}

export function Deck({
  deck,
  mapSlot,
  mapCredit,
  doneHref,
  doneLabel,
}: {
  deck: StoredDeck;
  mapSlot: ReactNode;
  mapCredit: string;
  doneHref: string;
  doneLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const last = deck.cards.length - 1;
  const card = deck.cards[index];
  const go = (step: number) => setIndex((i) => Math.max(0, Math.min(last, i + step)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const moved = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(moved) > 50) go(moved < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <article className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_0_#e9dcc3]">
        {card.key === "where" ? (
          <>
            <div className="flex h-64 items-center justify-center bg-[#eaf5ff] p-3">{mapSlot}</div>
            <p className="bg-[#f6efe0] px-4 py-1.5 text-[11px] text-slate-500">{mapCredit}</p>
          </>
        ) : card.photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.photo.url} alt="" className="h-64 w-full object-cover" />
            <PhotoCredit photo={card.photo} />
          </>
        ) : null}

        <div className="p-5 sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#c05a3c]">
            {index + 1} · {card.tag}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">{card.title}</h2>

          <div className="mt-4 flex items-start gap-3">
            <GuideAvatar avatar={deck.guide.avatar} size={52} label={deck.guide.name} />
            <p className="rounded-2xl rounded-tl-sm bg-[#fff3c9] px-4 py-3 text-lg leading-relaxed">{card.text}</p>
          </div>

          {card.words && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {card.words.map((w) => (
                <li key={w.word} className="rounded-2xl bg-[#eaf5ff] p-3 text-center">
                  <span className="block text-xl font-extrabold">{w.word}</span>
                  <span className="block text-sm text-slate-600">{w.meaning}</span>
                  <span className="block text-xs text-slate-500">say: {w.say}</span>
                </li>
              ))}
            </ul>
          )}

          {card.timeline && (
            <ol className="mt-4 divide-y divide-dashed divide-[#eadfca]">
              {card.timeline.map((t) => (
                <li key={t.time + t.what} className="flex gap-3 py-1.5">
                  <span className="w-16 shrink-0 font-extrabold text-[#c05a3c]">{t.time}</span>
                  <span>{t.what}</span>
                </li>
              ))}
            </ol>
          )}

          {card.question && (
            <p className="mt-4 rounded-2xl bg-[#e7f7ef] px-4 py-3 font-bold text-[#1f7650]">Your turn: {card.question}</p>
          )}

          {card.key === "hello" && (
            <p className="mt-3 text-xs text-slate-500">
              {deck.guide.name} is a made-up character, {deck.guide.age} years old like you. The photos are real.
            </p>
          )}
          {card.key === "yourTurn" && (
            <p className="mt-3 text-xs text-slate-500">There is no right answer. Think about it, or tell a grown-up.</p>
          )}
        </div>
      </article>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="rounded-2xl bg-white px-5 py-3 font-extrabold shadow-[0_3px_0_#e9dcc3] disabled:opacity-40"
        >
          ← Back
        </button>
        <div className="flex gap-1.5" aria-label={`Card ${index + 1} of ${deck.cards.length}`}>
          {deck.cards.map((c, i) => (
            <span key={c.key} className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-[#c05a3c]" : "bg-[#e1d6bf]"}`} />
          ))}
        </div>
        {index < last ? (
          <button onClick={() => go(1)} className="rounded-2xl bg-[#2f9e6e] px-5 py-3 font-extrabold text-white shadow-[0_3px_0_#1f7650]">
            Next →
          </button>
        ) : (
          <Link href={doneHref} className="rounded-2xl bg-[#2f9e6e] px-5 py-3 font-extrabold text-white shadow-[0_3px_0_#1f7650]">
            {doneLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
