"use client";

import { useState, useTransition } from "react";
import type { Avatar } from "@/lib/avatar";
import type { StoredQuestion } from "@/lib/content";
import { GuideAvatar } from "./GuideAvatar";

export type QuizItem = StoredQuestion & {
  /** Who asks, and from where */
  guide: { name: string; avatar: Avatar };
  countryLabel: string;
  /** The country's cards, for a second look after a wrong answer */
  peek: { title: string; text: string }[];
};

export function Quiz({
  items,
  heading,
  finishLabel,
  onFinish,
}: {
  items: QuizItem[];
  heading: string;
  finishLabel: string;
  onFinish: (firstTry: number) => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [pending, startTransition] = useTransition();
  const item = items[index];
  const isLast = index === items.length - 1;

  const choose = (answer: number) => {
    if (solved || wrong.includes(answer)) return;
    if (answer === item.correct) {
      setSolved(true);
      setPeeking(false);
      if (wrong.length === 0) setFirstTry((n) => n + 1);
    } else {
      setWrong((w) => [...w, answer]);
    }
  };

  const next = () => {
    if (isLast) {
      startTransition(() => onFinish(firstTry));
      return;
    }
    setIndex((i) => i + 1);
    setWrong([]);
    setSolved(false);
    setPeeking(false);
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_4px_0_#e9dcc3] sm:p-7">
      <p className="text-sm text-slate-500">
        {heading} · question {index + 1} of {items.length} · {item.countryLabel}
      </p>
      <div className="mt-3 flex items-start gap-3">
        <GuideAvatar avatar={item.guide.avatar} size={52} label={item.guide.name} />
        <h2 className="rounded-2xl rounded-tl-sm bg-[#fff3c9] px-4 py-3 text-xl font-extrabold">{item.question}</h2>
      </div>

      <div className="mt-5 grid gap-3">
        {item.answers.map((answer, i) => {
          const isRight = solved && i === item.correct;
          const isWrong = wrong.includes(i);
          return (
            <button
              key={answer}
              onClick={() => choose(i)}
              disabled={solved || isWrong}
              className={`rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold ${
                isRight
                  ? "border-[#2f9e6e] bg-[#e7f7ef]"
                  : isWrong
                    ? "border-[#e2a03f] bg-[#fff4df] text-slate-500"
                    : "border-[#e9dcc3] bg-white hover:border-[#c05a3c]"
              }`}
            >
              {isRight ? "✅ " : isWrong ? "🤔 " : ""}
              {answer}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {!solved && wrong.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#fff4df] px-4 py-3">
            <p className="font-bold">Not quite. Try again!</p>
            <p className="mt-1">Hint: {item.hint}</p>
            <button onClick={() => setPeeking((p) => !p)} className="mt-2 font-bold text-[#3b6ea5] underline">
              {peeking ? "Hide the cards" : "Look at the cards again 👀"}
            </button>
          </div>
        )}
        {peeking && !solved && (
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-[#fff8ec] p-3">
            {item.peek.map((c) => (
              <li key={c.title}>
                <span className="font-extrabold">{c.title}: </span>
                {c.text}
              </li>
            ))}
          </ul>
        )}
        {solved && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-extrabold text-[#1f7650]">{wrong.length === 0 ? "Yes! First try! 🎉" : "That's it! Well done! 👏"}</p>
            <button
              onClick={next}
              disabled={pending}
              className="rounded-2xl bg-[#2f9e6e] px-5 py-3 font-extrabold text-white shadow-[0_3px_0_#1f7650] disabled:opacity-60"
            >
              {isLast ? (pending ? "One moment…" : finishLabel) : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
