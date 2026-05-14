import type { APIRoute } from "astro";
import { SESSION_COOKIE, clearSessionCookie, destroySession } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  clearSessionCookie(cookies);
  return redirect("/admin/login");
};
