import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "../../lib/rate-limit";
import { verifyTurnstile } from "../../lib/turnstile";
import { createIntercomConversation } from "../../lib/intercom";
import { CLAUDE_MODEL } from "../../lib/claude";
import type { IntercomCategory } from "../../lib/intercom-tags";

export const prerender = false;

const ALLOWED: IntercomCategory[] = [
  "abrechnung",
  "technik",
  "projekt",
  "vertrag",
  "ausbildung",
  "community",
  "sonstiges",
];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_body" }), { status: 400 });
  }

  const { name, email, phone, message, turnstileToken, chatHistory } = body ?? {};
  if (!name || !email) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }
  const historyArr: Array<{ role: string; content: string }> = Array.isArray(chatHistory) ? chatHistory : [];
  const hasChat = historyArr.length > 1; // Sandys Begrüßung zählt nicht als Kontext
  if (!hasChat && !String(message ?? "").trim()) {
    return new Response(JSON.stringify({ error: "missing_message" }), { status: 400 });
  }

  // Anliegen-Text als initiale User-Message vorne anhängen, damit AI-Summary
  // und Intercom-Conversation den Kontext klar haben.
  const effectiveHistory = String(message ?? "").trim()
    ? [{ role: "user", content: String(message).trim() }, ...historyArr]
    : historyArr;

  const turnstileOk = await verifyTurnstile(turnstileToken ?? "", clientAddress);
  if (!turnstileOk) {
    return new Response(JSON.stringify({ error: "turnstile_failed" }), { status: 403 });
  }

  const limited = await rateLimit({
    key: `escalate:${String(email).toLowerCase()}`,
    max: 1,
    window: 60 * 60 * 24,
  });
  if (limited) {
    return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 });
  }

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  let summary = "Eskalation aus dem SalesAgent-Hilfebereich.";
  let category: IntercomCategory = "sonstiges";

  if (apiKey && effectiveHistory.length > 0) {
    try {
      const client = new Anthropic({ apiKey });

      const summaryPromise = client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        system:
          "Du fasst eine Support-Anfrage in 1-2 prägnanten Sätzen zusammen, damit das Support-Team beim Öffnen sofort den Kontext versteht. Antworte NUR mit dem Summary-Text, ohne Einleitung, ohne Anführungszeichen.",
        messages: [{ role: "user", content: JSON.stringify(effectiveHistory) }],
      });

      const categoryPromise = client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 30,
        system:
          "Du klassifizierst Support-Anfragen. Antworte AUSSCHLIESSLICH mit einem der folgenden Tokens, ohne weiteren Text: abrechnung, technik, projekt, vertrag, ausbildung, community, sonstiges. Bei Unklarheit: sonstiges.",
        messages: [{ role: "user", content: JSON.stringify(effectiveHistory) }],
      });

      const [summaryRes, categoryRes] = await Promise.all([summaryPromise, categoryPromise]);
      const sText = summaryRes.content.find((c: any) => c.type === "text") as any;
      if (sText?.text) summary = String(sText.text).trim().replace(/^["']|["']$/g, "");
      const cText = categoryRes.content.find((c: any) => c.type === "text") as any;
      const candidate = String(cText?.text ?? "").trim().toLowerCase();
      if ((ALLOWED as string[]).includes(candidate)) category = candidate as IntercomCategory;
    } catch (e) {
      console.warn("Claude summary/classification failed:", e);
    }
  }

  try {
    await createIntercomConversation({
      name,
      email,
      phone,
      summary,
      category,
      chatHistory: effectiveHistory,
    });
  } catch (e: any) {
    console.error("Intercom escalation failed:", e);
    return new Response(JSON.stringify({ error: "intercom_failed", detail: e?.message }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true, category }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
