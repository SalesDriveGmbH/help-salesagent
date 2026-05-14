import { kv } from "@vercel/kv";
import type { AstroCookies } from "astro";

export const SESSION_COOKIE = "sd_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function allowedEmails(): string[] {
  return (import.meta.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string): boolean {
  const list = allowedEmails();
  return list.length === 0 ? false : list.includes(email.trim().toLowerCase());
}

export async function createSession(email: string): Promise<string> {
  const token = crypto.randomUUID();
  await kv.set(
    `session:${token}`,
    { email: email.toLowerCase(), createdAt: Date.now() },
    { ex: SESSION_TTL_SECONDS },
  );
  return token;
}

export async function getSessionEmail(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const data = (await kv.get(`session:${token}`)) as { email: string } | null;
    return data?.email ?? null;
  } catch {
    return null;
  }
}

export async function destroySession(token: string): Promise<void> {
  try { await kv.del(`session:${token}`); } catch {}
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}
