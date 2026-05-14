import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "../../../lib/rate-limit";
import { listAllArticleSummaries } from "../../../lib/knowledge";
import { saveDraft } from "../../../lib/drafts";
import { CLAUDE_MODEL } from "../../../lib/claude";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const email = locals.adminEmail ?? "unknown@admin";
  const limited = await rateLimit({ key: `admin-analyze:${email}`, max: 60, window: 3600 });
  if (limited) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 });

  const { note } = await request.json().catch(() => ({}));
  if (!note || typeof note !== "string" || note.trim().length < 3) {
    return new Response(JSON.stringify({ error: "missing_note" }), { status: 400 });
  }

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "anthropic_key_missing" }), { status: 500 });

  const articles = await listAllArticleSummaries();
  const articleList = articles
    .map((a) => `- ${a.id} (${a.category}, ${a.status}): ${a.title}\n  Auszug: ${a.firstParagraph}`)
    .join("\n");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2500,
    system: `Du bist ein Knowledge-Base-Editor für SalesDrive. Du erhältst eine rohe Notiz vom Management und musst entscheiden:
1. Betrifft das einen existierenden Artikel (= Update)?
2. Oder ist das ein komplett neues Thema (= New)?

Existierende Artikel mit Kurzfassung:
${articleList}

Antworte AUSSCHLIESSLICH mit gültigem JSON nach diesem Schema:
{
  "type": "new" | "update",
  "category": "abrechnung" | "technik" | "projekt" | "vertrag" | "ausbildung" | "community",
  "matchedArticleId": "A04" | null,
  "suggestedTitle": "...",
  "suggestedSlug": "lower-case-kebab-slug",
  "suggestedContent": "<voller Markdown-Inhalt für neuen Artikel ODER aktualisierter Abschnitt>",
  "diffBefore": "<exakter alter Block, falls update — sonst leerer String>",
  "diffAfter": "<neuer Block, falls update — sonst leerer String>",
  "reasoning": "<1-2 Sätze warum>"
}

Wichtig: Antworte mit reinem JSON, ohne Markdown-Codeblock, ohne Einleitung.`,
    messages: [{ role: "user", content: `Notiz:\n${note}` }],
  });

  const textBlock = res.content.find((c: any) => c.type === "text") as any;
  if (!textBlock?.text) return new Response(JSON.stringify({ error: "no_response" }), { status: 502 });

  let parsed: any;
  try {
    let raw = textBlock.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    parsed = JSON.parse(raw);
  } catch (e) {
    return new Response(JSON.stringify({ error: "parse_error", raw: textBlock.text }), { status: 502 });
  }

  const draftId = await saveDraft({
    note,
    aiResponse: parsed,
    createdBy: email,
    createdAt: Date.now(),
    status: "pending",
    source: "manual",
  });

  return new Response(
    JSON.stringify({
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
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
