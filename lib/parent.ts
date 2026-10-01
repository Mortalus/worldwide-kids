import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSetting, setSetting } from "./db";

const COOKIE = "wk_parent";

// The PIN keeps children out of settings on a shared device. It is not a security boundary.
function hash(pin: string, salt: string): Buffer {
  return scryptSync(pin, salt, 32);
}

export function hasPin(): boolean {
  return getSetting("pin_hash") !== null;
}

export function savePin(pin: string): void {
  const salt = randomBytes(16).toString("hex");
  setSetting("pin_salt", salt);
  setSetting("pin_hash", hash(pin, salt).toString("hex"));
}

export function pinMatches(pin: string): boolean {
  const salt = getSetting("pin_salt");
  const stored = getSetting("pin_hash");
  if (!salt || !stored) return false;
  return timingSafeEqual(hash(pin, salt), Buffer.from(stored, "hex"));
}

export async function openParentSession(): Promise<void> {
  const token = randomBytes(24).toString("hex");
  setSetting("parent_token", token);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 30, path: "/" });
}

export async function closeParentSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isParent(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return Boolean(token) && token === getSetting("parent_token");
}
