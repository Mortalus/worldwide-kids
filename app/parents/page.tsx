import Link from "next/link";
import { getCountry } from "@/data/countries";
import { enterParents, leaveParents, removeChild, saveChild } from "@/lib/actions";
import { KID_AVATARS } from "@/lib/avatar";
import { hasApiKey, QUIZ_QUESTIONS } from "@/lib/content";
import { getSetting, listChildren, listReviews, listVisits, type Child } from "@/lib/db";
import { hasPin, isParent } from "@/lib/parent";
import { addDays, today, WEEKDAY_NAMES } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const field = "mt-1 w-full rounded-xl border-2 border-[#e9dcc3] bg-white px-3 py-2";
const label = "mt-3 block text-sm font-bold text-slate-600";
const panel = "rounded-3xl bg-white p-6 shadow-[0_4px_0_#e9dcc3]";
const button = "rounded-2xl bg-[#3b6ea5] px-5 py-2.5 font-extrabold text-white shadow-[0_3px_0_#2a5383]";

function ChildForm({ child }: { child?: Child }) {
  const days = child?.weekdays ?? [0, 2, 4];
  return (
    <form action={saveChild}>
      {child && <input type="hidden" name="id" value={child.id} />}
      <label className={label}>
        Name
        <input name="name" required maxLength={30} defaultValue={child?.name} className={field} />
      </label>
      <label className={label}>
        Age
        <select name="age" defaultValue={child?.age ?? 8} className={field}>
          {Array.from({ length: 10 }, (_, i) => i + 5).map((age) => (
            <option key={age}>{age}</option>
          ))}
        </select>
      </label>
      <fieldset className="mt-3">
        <legend className="text-sm font-bold text-slate-600">Boy or girl (used for he/she in the text)</legend>
        {(["girl", "boy"] as const).map((g) => (
          <label key={g} className="mr-5 mt-1 inline-flex items-center gap-1.5 capitalize">
            <input type="radio" name="gender" value={g} required defaultChecked={child?.gender === g} /> {g}
          </label>
        ))}
      </fieldset>
      <fieldset className="mt-3">
        <legend className="text-sm font-bold text-slate-600">Picture</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {KID_AVATARS.map((a, i) => (
            <label key={a} className="cursor-pointer">
              <input type="radio" name="avatar" value={a} required defaultChecked={child ? child.avatar === a : i === 0} className="peer sr-only" />
              <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-transparent bg-[#fff8ec] text-2xl peer-checked:border-[#c05a3c] peer-focus-visible:ring-2">
                {a}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-3">
        <legend className="text-sm font-bold text-slate-600">A new country on these days (one per ticked day, each week)</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {WEEKDAY_NAMES.map((name, i) => (
            <label key={name} className="cursor-pointer">
              <input type="checkbox" name="weekdays" value={i} defaultChecked={days.includes(i)} className="peer sr-only" />
              <span className="grid h-10 w-12 place-items-center rounded-full bg-[#e6ebf5] text-sm font-bold peer-checked:bg-[#2f9e6e] peer-checked:text-white peer-focus-visible:ring-2">
                {name.slice(0, 2)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className={`${button} mt-5`}>{child ? "Save changes" : "Add child"}</button>
    </form>
  );
}

function Progress({ child }: { child: Child }) {
  const visits = listVisits(child.id);
  const reviews = listReviews(child.id);
  const error = getSetting(`error_${child.id}`);
  const ageIsOld = addDays(child.ageSetOn, 365) <= today();
  return (
    <div className="mt-4 text-sm">
      {ageIsOld && (
        <p className="mb-2 rounded-xl bg-[#fff4df] px-3 py-2 font-bold">
          {child.name}&apos;s age was set over a year ago. Is {child.age} still right?
        </p>
      )}
      {error && <p className="mb-2 rounded-xl bg-[#fff4df] px-3 py-2">Last problem loading a country: {error}</p>}
      <p className="font-bold">Countries</p>
      {visits.length === 0 ? (
        <p className="text-slate-500">None yet.</p>
      ) : (
        <ul>
          {visits.map((v) => (
            <li key={v.code}>
              {getCountry(v.code)?.flag} {getCountry(v.code)?.name}:{" "}
              {v.status === "done"
                ? `finished ${v.completedOn}, ${v.quizFirstTry} of ${QUIZ_QUESTIONS} right first try`
                : `started ${v.unlockedOn}, quiz not done yet`}
              {v.source === "sample" && " (sample text)"}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 font-bold">Weekly reviews</p>
      {reviews.length === 0 ? (
        <p className="text-slate-500">None yet.</p>
      ) : (
        <ul>
          {reviews.map((r, i) => (
            <li key={i}>
              {r.doneOn}: {r.firstTry} of {r.total} right first try ({r.codes.map((c) => getCountry(c)?.name).join(", ")})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function ParentsPage({ searchParams }: { searchParams: Promise<{ problem?: string; saved?: string }> }) {
  const { problem, saved } = await searchParams;
  const alert = problem && (
    <p role="alert" className="mb-4 rounded-2xl bg-[#fff4df] px-4 py-3 font-bold">
      {problem}
    </p>
  );

  if (!(await isParent())) {
    const firstTime = !hasPin();
    return (
      <div className="mx-auto max-w-sm">
        {alert}
        <form action={enterParents} className={panel}>
          <h1 className="text-2xl font-extrabold">Parents</h1>
          <label className={label}>
            {firstTime ? "Choose a 4-digit PIN to keep the settings for grown-ups" : "Enter your 4-digit PIN"}
            <input name="pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} required autoFocus autoComplete="off" className={field} />
          </label>
          <button className={`${button} mt-5`}>{firstTime ? "Set PIN" : "Open"}</button>
        </form>
        <p className="mt-6 text-center">
          <Link href="/" className="font-bold underline">
            ← Back
          </Link>
        </p>
      </div>
    );
  }

  const children = listChildren();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Parents</h1>
        <form action={leaveParents}>
          <button className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-[0_2px_0_#e9dcc3]">Lock and go back</button>
        </form>
      </header>
      {alert}
      {saved && <p className="rounded-2xl bg-[#e7f7ef] px-4 py-3 font-bold text-[#1f7650]">Saved.</p>}

      {!hasApiKey() && (
        <p className="rounded-2xl bg-[#e6ebf5] px-4 py-3 text-sm">
          <b>Sample mode.</b> No Anthropic API key is set, so lessons use simple built-in text that is the same for every age. Add{" "}
          <code>ANTHROPIC_API_KEY=…</code> to the file <code>.env.local</code> and restart the app to get lessons written for each child.
        </p>
      )}

      {children.map((child) => (
        <section key={child.id} className={panel}>
          <h2 className="text-xl font-extrabold">
            {child.avatar} {child.name}, {child.age}
          </h2>
          <Progress child={child} />
          <details className="mt-4">
            <summary className="font-bold text-[#3b6ea5]">Edit {child.name}</summary>
            <ChildForm child={child} />
            <form action={removeChild} className="mt-6 border-t border-dashed border-[#eadfca] pt-4">
              <input type="hidden" name="id" value={child.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" required /> Yes, remove {child.name} and all of {child.name}&apos;s progress
              </label>
              <button className="mt-2 rounded-xl border-2 border-[#e2574c] px-4 py-1.5 text-sm font-bold text-[#b63a30]">Remove child</button>
            </form>
          </details>
        </section>
      ))}

      <section className={panel}>
        <h2 className="text-xl font-extrabold">Add a child</h2>
        <ChildForm />
      </section>
    </div>
  );
}
