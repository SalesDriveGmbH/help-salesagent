import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@vercel/kv";
import { loadInsights } from "../../../lib/insights";
import { CLAUDE_MODEL } from "../../../lib/claude";
import { listAllArticleSummaries } from "../../../lib/knowledge";

export const prerender = false;

const CACHE_KEY = "ins:summary";
const CACHE_TTL = 60 * 30; // 30 min Cache

export const GET: APIRoute = async ({ url }) => {
  const force = url.searchParams.get("force") === "1";

  // Cache
  if (!force) {
    try {
      const cached = (await kv.get(CACHE_KEY)) as { summary: string; ts: number } | null;
      if (cached?.summary) {
        return new Response(JSON.stringify(cached), { headers: { "Content-Type": "application/json" } });
      }
    } catch {}
  }

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ summary: "Anthropic-Key fehlt." }), { status: 200 });

  const [insights, articles] = await Promise.all([
    loadInsights(),
    listAllArticleSummaries(),
  ]);

  // Wenn fast keine Daten: gib eine Default-Antwort
  const dataPoints =
    insights.topSearches.length + insights.noResultSearches.length + insights.topViews.length;
  if (dataPoints < 3) {
    const summary = "Noch zu wenig Daten — sobald Sales Agents anfangen zu suchen und Artikel zu öffnen, melde ich mich mit konkreten Empfehlungen.";
    return new Response(JSON.stringify({ summary }), { headers: { "Content-Type": "application/json" } });
  }

  const articleList = articles.map((a) => `- ${a.id} (${a.category}, ${a.status}): ${a.title}`).join("\n");

  const dataBlock = `
TOP-SUCHEN (mit Trefferanzahl):
${insights.topSearches.map((s) => `- "${s.value}" × ${s.count}`).join("\n") || "(keine)"}

SUCHEN OHNE TREFFER:
${insights.noResultSearches.map((s) => `- "${s.value}" × ${s.count}`).join("\n") || "(keine)"}

MEIST GELESEN:
${insights.topViews.map((s) => `- ${s.value} × ${s.count}`).join("\n") || "(keine)"}

MEIST GEBOOKMARKED:
${insights.topBookmarks.map((s) => `- ${s.value} × ${s.count}`).join("\n") || "(keine)"}

ESKALATIONEN NACH KATEGORIE:
${insights.escalationsByCategory.map((s) => `- ${s.value} × ${s.count}`).join("\n") || "(keine)"}
`.trim();

  const systemPrompt = `Du bist Sandy, AI-Assistentin für SalesDrive. Du analysierst Nutzungs-Daten der Wissensdatenbank und gibst Lukas konkrete Empfehlungen, was er als nächstes verbessern oder ergänzen sollte. Antworte in 2–4 sehr knappen Sätzen, direkt umsetzbar, Du-Form. Wenn "Suchen ohne Treffer" vorhanden sind, weise priorisiert darauf hin (das sind Lücken in der KB). Falls Eskalationen in einer Kategorie häufen, schlage einen neuen FAQ-Artikel vor. Keine Floskeln, keine Zahlen wiederholen — Konkrete Aktion. Antworte ohne Anführungszeichen, ohne Markdown, ohne Listen.`;

  const userPrompt = `Hier sind die aktuellen KB-Daten:

${dataBlock}

EXISTIERENDE ARTIKEL:
${articleList}

Was empfiehlst du Lukas konkret als nächstes?`;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 280,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = (res.content.find((c: any) => c.type === "text") as any)?.text?.trim() ?? "";
    const summary = text || "Keine konkrete Empfehlung — die Datenlage ist solide.";
    try { await kv.set(CACHE_KEY, { summary, ts: Date.now() }, { ex: CACHE_TTL }); } catch {}
    return new Response(JSON.stringify({ summary }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ summary: "Sandy konnte gerade nicht antworten." }), { status: 200 });
  }
};
