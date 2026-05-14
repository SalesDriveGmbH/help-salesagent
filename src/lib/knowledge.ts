import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export interface RetrievedArticle {
  id: string;
  title: string;
  category: string;
  slug: string;
  url: string;
  body: string;
  keywords: string[];
  tldr?: string;
}

let cache: RetrievedArticle[] | null = null;

async function loadAll(): Promise<RetrievedArticle[]> {
  if (cache) return cache;
  const all = await getCollection("articles");
  cache = all.map((entry: CollectionEntry<"articles">) => {
    const slug = entry.id.replace(/^[^/]+\//, "");
    return {
      id: entry.data.id,
      title: entry.data.title,
      category: entry.data.category,
      slug,
      url: `/artikel/${entry.data.category}/${slug}`,
      body: entry.body ?? "",
      keywords: entry.data.keywords ?? [],
      tldr: entry.data.tldr,
    };
  });
  return cache;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9äöü\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

const STOP = new Set([
  "und","oder","ist","der","die","das","den","dem","des","ein","eine","einen","einem","einer","eines",
  "ich","du","er","sie","es","wir","ihr","sie","mich","dich","mir","dir","mein","meine","meinem","meinen",
  "wie","was","wer","wo","wann","warum","mit","von","im","in","an","auf","für","zu","bei","aus","nach",
  "the","and","or","is","of","to","for","at","be","do","my","me"
]);

export async function retrieveRelevantArticles(query: string, opts: { topK?: number } = {}): Promise<RetrievedArticle[]> {
  const { topK = 5 } = opts;
  const articles = await loadAll();
  const qTokens = tokenize(query).filter((t) => !STOP.has(t));
  if (qTokens.length === 0) {
    return articles.sort(() => 0.5 - Math.random()).slice(0, topK);
  }

  const scores: { entry: RetrievedArticle; score: number }[] = [];
  for (const a of articles) {
    const titleTokens = tokenize(a.title);
    const keywordTokens = a.keywords.flatMap(tokenize);
    const bodyTokens = tokenize(a.body);
    let score = 0;
    for (const qt of qTokens) {
      const tHits = titleTokens.filter((t) => t === qt || t.startsWith(qt) || qt.startsWith(t)).length;
      const kHits = keywordTokens.filter((t) => t === qt || t.startsWith(qt)).length;
      const bHits = bodyTokens.filter((t) => t === qt).length;
      score += tHits * 8 + kHits * 5 + Math.min(bHits, 5) * 1.5;
    }
    if (score > 0) scores.push({ entry: a, score });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK).map((s) => s.entry);
}

export async function listAllArticleSummaries(): Promise<Array<{ id: string; title: string; category: string; slug: string; firstParagraph: string; status: string }>> {
  const all = await getCollection("articles");
  return all.map((entry) => {
    const slug = entry.id.replace(/^[^/]+\//, "");
    const firstPara = (entry.body ?? "").split(/\n\n/).find((p) => p.trim().length > 0) ?? "";
    return {
      id: entry.data.id,
      title: entry.data.title,
      category: entry.data.category,
      slug,
      firstParagraph: firstPara.slice(0, 280),
      status: entry.data.status,
    };
  });
}
