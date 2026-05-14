import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "../../../lib/rate-limit";
import { listAllArticleSummaries } from "../../../lib/knowledge";
import { saveDraft } from "../../../lib/drafts";
import { fetchConversationFull } from "../../../lib/intercom";
import { CLAUDE_MODEL } from "../../../lib/claude";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const email = locals.adminEmail ?? "unknown@admin";
  const limited = await rateLimit({ key: `admin-intercom-analyze:${email}`, max: 60, window: 3600 });
  if (limited) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 });

  const { conversationId } = await request.json().catch(() => ({}));
  if (!conversationId) return new Response(JSON.stringify({ error: "missing_conversation_id" }), { status: 400 });

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "anthropic_key_missing" }), { status: 500 });

  let conv: any;
  try { conv = await fetchConversationFull(conversationId); }
  catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 502 }); }

  const transcript: string[] = [];
  const parts = conv?.conversation_parts?.conversation_parts ?? [];
  if (conv?.source?.body) {
    transcript.push(`[${conv.source.author?.type === "user" ? "User" : "Support"}]: ${stripHtml(conv.source.body)}`);
  }
  for (const p of parts) {
    if (!p.body) continue;
    const who = p.author?.type === "user" ? "User" : "Support";
    transcript.push(`[${who}]: ${stripHtml(p.body)}`);
  }

  const articles = await listAllArticleSummaries();
  const articleList = articles.map((a) => `- ${a.id} (${a.category}): ${a.title}`).join("\n");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2500,
    system: `Du bist ein Knowledge-Base-Editor für SalesDrive. Hier ist eine Support-Conversation, die kürzlich gelöst wurde. Deine Aufgabe: prüfe, ob daraus ein neuer FAQ-Artikel werden sollte oder ein bestehender Artikel ergänzt werden sollte, damit zukünftige SalesAgents diese Frage selbst beantworten können.

Existierende Artikel:
${articleList}

Antworte AUSSCHLIESSLICH mit gültigem JSON. Bei type=skip nur das Feld reasoning ausfüllen.
Schema bei new/update:
{
  "type": "new" | "update",
  "category": "abrechnung" | "technik" | "projekt" | "vertrag" | "ausbildung" | "community",
  "matchedArticleId": "A04" | null,
  "suggestedTitle": "...",
  "suggestedSlug": "kebab-slug",
  "suggestedContent": "<Markdown>",
  "diffBefore": "...",
  "diffAfter": "...",
  "reasoning": "..."
}
Schema bei skip: { "type": "skip", "reasoning": "..." }`,
    messages: [{ role: "user", content: `Conversation:\n${transcript.join("\n\n")}` }],
  });

  const textBlock = res.content.find((c: any) => c.type === "text") as any;
  if (!textBlock?.text) return new Response(JSON.stringify({ error: "no_response" }), { status: 502 });

  let parsed: any;
  try {
    let raw = textBlock.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "parse_error", raw: textBlock.text }), { status: 502 });
  }

  if (parsed.type === "skip") {
    return new Response(JSON.stringify({ type: "skip", reasoning: parsed.reasoning }), { headers: { "Content-Type": "application/json" } });
  }

  const draftId = await saveDraft({
    note: `Aus Intercom-Conversation ${conversationId}:\n\n${transcript.join("\n")}`,
    aiResponse: parsed,
    createdBy: email,
    createdAt: Date.now(),
    status: "pending",
    source: "intercom",
  });

  return new Response(JSON.stringify({
    draftId,
    type: parsed.type,
    category: parsed.category,
    matchedArticleId: parsed.matchedArticleId ?? null,
    suggestedTitle: parsed.suggestedTitle,
    suggestedSlug: parsed.suggestedSlug,
    suggestedContent: parsed.suggestedContent,
    diffBefore: parsed.diffBefore ?? "",
    diffAfter: parsed.diffAfter ?? "",
    reasoning: parsed.reasoning,
  }), { headers: { "Content-Type": "application/json" } });
};

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}
