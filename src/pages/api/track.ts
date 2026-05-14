import type { APIRoute } from "astro";
import { trackEvent } from "../../lib/insights";

export const prerender = false;

const ALLOWED = new Set([
  "search", "search-no-result", "article-view", "bookmark", "chat-open", "escalation",
]);

// Bots aus dem Tracking ausschließen — sonst verzerren sie die Insights
const BOT_RE = /bot|crawler|spider|crawling|preview|wget|curl|facebookexternalhit|whatsapp|telegram|slack/i;

export const POST: APIRoute = async ({ request }) => {
  // Bots skippen
  const ua = request.headers.get("user-agent") ?? "";
  if (BOT_RE.test(ua)) return new Response("", { status: 204 });

  let body: any;
  try { body = await request.json(); } catch {
    return new Response("", { status: 204 });
  }
  const event = String(body?.event ?? "");
  const value = body?.value !== undefined ? String(body.value) : undefined;
  if (!ALLOWED.has(event)) return new Response("", { status: 204 });
  await trackEvent(event as any, value);
  return new Response("", { status: 204 });
};
