"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { COUNTRIES, getCountry } from "@/data/countries";
import {
  completeVisit,
  createChild,
  deleteChild,
  deleteSetting,
  getChild,
  getVisit,
  insertVisit,
  listVisits,
  recordReview,
  setSetting,
  updateChild,
  type ChildInput,
} from "./db";
import { makeDeck } from "./decks";
import { closeParentSession, hasPin, isParent, openParentSession, pinMatches, savePin } from "./parent";
import { pickCountry } from "./picker";
import { decide, reviewDue, today } from "./schedule";
import { QUIZ_QUESTIONS, REVIEW_QUESTIONS } from "./content";
import { KID_AVATARS } from "./avatar";

export async function startNewCountry(childId: number): Promise<void> {
  const child = getChild(childId);
  if (!child) redirect("/");
  const visits = listVisits(childId);
  const decision = decide(visits, child.weekdays, today(), COUNTRIES.length);
  if (decision.kind !== "new") redirect(`/kid/${childId}`);

  const last = visits.at(-1);
  const country = pickCountry(
    visits.map((v) => v.code),
    last ? (getCountry(last.code)?.continent ?? null) : null,
  );
  if (!country) redirect(`/kid/${childId}`);

  // Guides alternate girl, boy, girl … from one country to the next.
  const guideGender = visits.length % 2 === 0 ? "girl" : "boy";
  let made;
  try {
    made = await makeDeck(child, country, guideGender);
  } catch (error) {
    console.error("Could not create lesson:", error);
    setSetting(`error_${childId}`, `${today()}: ${country.name}: ${error instanceof Error ? error.message : String(error)}`);
    redirect(`/kid/${childId}?problem=1`);
  }
  insertVisit(childId, country.code, today(), made.source, made.deck);
  deleteSetting(`error_${childId}`);
  revalidatePath("/");
  redirect(`/kid/${childId}/country/${country.code}`);
}

export async function finishQuiz(childId: number, code: string, firstTry: number): Promise<void> {
  const visit = getVisit(childId, code);
  if (!visit) redirect("/");
  if (visit.status === "active") {
    completeVisit(childId, code, today(), Math.max(0, Math.min(QUIZ_QUESTIONS, Math.round(firstTry))));
    revalidatePath("/");
  }
  redirect(`/kid/${childId}/passport?stamp=${code}`);
}

export async function finishReview(childId: number, firstTry: number): Promise<void> {
  const child = getChild(childId);
  if (!child) redirect("/");
  const codes = reviewDue(listVisits(childId), today());
  if (codes.length > 0) {
    const total = codes.length * REVIEW_QUESTIONS;
    recordReview(childId, codes, today(), Math.max(0, Math.min(total, Math.round(firstTry))), total);
    revalidatePath("/");
  }
  redirect(`/kid/${childId}?reviewed=1`);
}

function readChild(form: FormData): ChildInput | string {
  const name = String(form.get("name") ?? "").trim();
  const age = Number(form.get("age"));
  const gender = String(form.get("gender"));
  const avatar = String(form.get("avatar"));
  const weekdays = form.getAll("weekdays").map(Number);
  if (name.length < 1 || name.length > 30) return "Please enter a name of up to 30 letters.";
  if (!Number.isInteger(age) || age < 5 || age > 14) return "Age must be between 5 and 14.";
  if (gender !== "girl" && gender !== "boy") return "Please choose boy or girl.";
  if (!KID_AVATARS.includes(avatar)) return "Please choose a picture.";
  if (weekdays.length === 0 || weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    return "Please choose at least one day of the week.";
  }
  return { name, age, gender, avatar, weekdays: [...new Set(weekdays)].sort() };
}

export async function saveChild(form: FormData): Promise<void> {
  if (!(await isParent())) redirect("/parents");
  const input = readChild(form);
  if (typeof input === "string") redirect(`/parents?problem=${encodeURIComponent(input)}`);
  const id = Number(form.get("id"));
  if (id) updateChild(id, input, today());
  else createChild(input, today());
  revalidatePath("/");
  redirect("/parents?saved=1");
}

export async function removeChild(form: FormData): Promise<void> {
  if (!(await isParent())) redirect("/parents");
  deleteChild(Number(form.get("id")));
  revalidatePath("/");
  redirect("/parents");
}

export async function enterParents(form: FormData): Promise<void> {
  const pin = String(form.get("pin") ?? "");
  if (!/^\d{4}$/.test(pin)) redirect("/parents?problem=" + encodeURIComponent("The PIN is 4 digits."));
  if (!hasPin()) savePin(pin);
  else if (!pinMatches(pin)) redirect("/parents?problem=" + encodeURIComponent("That PIN is not right."));
  await openParentSession();
  redirect("/parents");
}

export async function leaveParents(): Promise<void> {
  await closeParentSession();
  redirect("/");
}
