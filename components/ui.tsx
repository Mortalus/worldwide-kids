"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

export const primaryButton =
  "inline-block rounded-2xl bg-[#2f9e6e] px-6 py-3 text-lg font-extrabold text-white shadow-[0_3px_0_#1f7650] disabled:opacity-60";

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? pendingText : children}
    </button>
  );
}

export function KidHeader({ childId, avatar, name }: { childId: number; avatar: string; name: string }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <Link href={`/kid/${childId}`} className="flex items-center gap-2 text-lg font-extrabold">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl shadow-[0_2px_0_#e9dcc3]">{avatar}</span>
        {name}
      </Link>
      <nav className="flex gap-2 text-sm font-bold">
        <Link href={`/kid/${childId}/passport`} className="rounded-full bg-white px-4 py-2 shadow-[0_2px_0_#e9dcc3]">
          📕 Passport
        </Link>
        <Link href="/" className="rounded-full bg-white px-4 py-2 shadow-[0_2px_0_#e9dcc3]">
          Switch
        </Link>
      </nav>
    </header>
  );
}
