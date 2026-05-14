import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "../../../lib/claude";
import { listAllArticleSummaries } from "../../../lib/knowledge";

export const prerender = false;

/**
 * Generiert einen Artikel-Vorschlag basierend auf Titel + Kategorie.
 * Wird im Library-Editor genutzt, wenn ein Admin einen neuen Artikel anlegt
 * und auf "Vorschlag generieren" klickt.
 */
export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "anthropic_key_missing" }), { status: 500 });

  const { title, category } = await request.json().catch(() => ({}));
  if (!title || !category) {
    return new Response(JSON.stringify({ error: "missing_title_or_category" }), { status: 400 });
  }

  const all = await listAllArticleSummaries();
  const examples = all
    .filter((a) => a.category === category && a.status === "complete")
    .slice(0, 2)
    .map((a) => `### ${a.title}\n${a.firstParagraph}`)
    .join("\n\n");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: `Du bist ein Knowledge-Base-Editor für SalesDrive. Schreibe einen kurzen, klaren Hilfe-Artikel.

STIL
- Du-Form, Deutsch, präzise
- Beginne mit einer "**Auf den Punkt:**"-Zeile (1 Satz, kursive Fakten in **fett**)
- Verwende ## H2-Headlines wenn nötig
- Konkrete Beträge, Fristen, Adressen in **fett** oder \`inline-code\`
- Bei rechtlich/steuerlich heiklen Themen ein Disclaimer ("Wir bieten keine Rechts-/Steuerberatung.")

FORMAT
- 100–250 Wörter
- Beispiele für die Kategorie "${category}":
${examples || "(keine Beispiele verfügbar)"}

Antworte AUSSCHLIESSLICH mit Markdown-Body (ohne Frontmatter, ohne Code-Fence). Lass das erste H1 weg — das wird aus dem Titel generiert.`,
    messages: [{ role: "user", content: `Schreib einen Artikel mit dem Titel: "${title}"` }],
  });

  const text = (res.content.find((c: any) => c.type === "text") as any)?.text?.trim() ?? "";
  const body = text.replace(/^```(?:markdown)?\s*/i, "").replace(/```\s*$/i, "").trim();

  return new Response(JSON.stringify({ body }), { headers: { "Content-Type": "application/json" } });
};
