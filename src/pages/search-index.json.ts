import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  const all = await getCollection("articles");
  const index = all.map((entry) => {
    const slug = entry.id.replace(/^[^/]+\//, "");
    // Body strippen für Suche: Markdown-Zeichen weg, normalisieren
    const body = (entry.body ?? "")
      .replace(/^---[\s\S]*?---/m, "")
      .replace(/[#*_`>\[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 800);

    return {
      id: entry.data.id,
      title: entry.data.title,
      category: entry.data.category,
      slug,
      url: `/artikel/${entry.data.category}/${slug}`,
      tldr: entry.data.tldr ?? "",
      keywords: entry.data.keywords ?? [],
      status: entry.data.status,
      priority: entry.data.faq_priority ?? 50,
      body,
    };
  });

  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
};
