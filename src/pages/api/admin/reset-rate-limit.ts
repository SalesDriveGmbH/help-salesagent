import type { APIRoute } from "astro";
import { kv } from "@vercel/kv";

export const prerender = false;

/**
 * Setzt das Escalation-Rate-Limit für eine Email zurück.
 * Beispiel: /api/admin/reset-rate-limit?email=l.lehner@salesdrive.at
 * Auth-protected via Middleware.
 */
export const GET: APIRoute = async ({ url }) => {
  const email = url.searchParams.get("email");
  if (!email) {
    return new Response(JSON.stringify({ error: "missing_email_param" }), { status: 400 });
  }
  const key = `escalate:${email.toLowerCase()}`;
  try {
    await kv.del(key);
    return new Response(JSON.stringify({ ok: true, key }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "kv_failed" }), { status: 500 });
  }
};
