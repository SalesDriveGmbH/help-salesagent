import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getFile, commitFile, listFileCommits } from "../../../../lib/github";
import { parseFrontmatter, serializeFrontmatter, type Frontmatter } from "../../../../lib/frontmatter";
import { saveDraft, logAudit } from "../../../../lib/drafts";

export const prerender = false;

async function articlePath(category: string, slug: string): Promise<string | null> {
  // Look up by collection entry to get the actual file name (prefix + slug)
  const all = await getCollection("articles");
  const entry = all.find((a) => a.data.category === category && a.id.endsWith(`/${slug}`));
  if (entry) {
    return `src/content/articles/${entry.id}.md`;
  }
  // fallback: try github list dir
  const owner = import.meta.env.GITHUB_REPO_OWNER;
  const repo = import.meta.env.GITHUB_REPO_NAME;
  const token = import.meta.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) return null;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articles/${category}?ref=main`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) return null;
  const dir = (await res.json()) as any[];
  const hit = dir.find((e) => typeof e.name === "string" && e.name.endsWith(`-${slug}.md`));
  return hit?.path ?? null;
}

export const GET: APIRoute = async ({ params }) => {
  const segs = (params.path ?? "").split("/").filter(Boolean);
  if (segs.length === 1 && segs[0] === "list") {
    const all = await getCollection("articles");
    return new Response(JSON.stringify({ articles: all.map((a) => ({ ...a.data, slug: a.id.replace(/^[^/]+\//, "") })) }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  if (segs.length === 2) {
    const [category, slug] = segs;
    const all = await getCollection("articles");
    const entry = all.find((a) => a.data.category === category && a.id.endsWith(`/${slug}`));
    if (!entry) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    return new Response(JSON.stringify({
      slug,
      frontmatter: { ...entry.data, tldr: entry.data.tldr ?? "" },
      body: entry.body ?? "",
    }), { headers: { "Content-Type": "application/json" } });
  }
  if (segs.length === 3 && segs[2] === "history") {
    const [category, slug] = segs;
    const path = await articlePath(category, slug);
    if (!path) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    try {
      const commits = await listFileCommits(path, 10);
      return new Response(JSON.stringify({
        commits: commits.map((c: any) => ({ sha: c.sha, message: c.commit?.message ?? "", date: c.commit?.author?.date ?? "" })),
      }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 502 });
    }
  }
  return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
};

interface PutBody {
  frontmatter: Frontmatter;
  body: string;
}

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const segs = (params.path ?? "").split("/").filter(Boolean);
  if (segs.length !== 2) return new Response(JSON.stringify({ error: "bad_path" }), { status: 400 });
  const [category, slug] = segs;
  const email = locals.adminEmail ?? "unknown@admin";

  const data = (await request.json().catch(() => ({}))) as PutBody;
  if (!data.frontmatter || typeof data.body !== "string") {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }
  data.frontmatter.last_updated = new Date().toISOString().slice(0, 10);
  data.frontmatter.category = category;

  const path = await articlePath(category, slug);
  if (!path) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
  const existing = await getFile(path);
  if (!existing) return new Response(JSON.stringify({ error: "file_missing" }), { status: 404 });

  const updated = serializeFrontmatter(data.frontmatter, data.body);
  await commitFile({
    path,
    content: updated,
    message: `KB: ${data.frontmatter.title} (direct edit) — via admin`,
    sha: existing.sha,
  });
  await logAudit({ email, action: "direct-publish", slug: path });

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, params, locals }) => {
  const segs = (params.path ?? "").split("/").filter(Boolean);
  const email = locals.adminEmail ?? "unknown@admin";
  const data = (await request.json().catch(() => ({}))) as PutBody;
  if (!data.frontmatter || typeof data.body !== "string") {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  // /api/admin/library/{cat}/{slug}/draft → save as draft
  if (segs.length === 3 && segs[2] === "draft") {
    const id = await saveDraft({
      note: `Direkter Edit aus Library: ${data.frontmatter.id}`,
      aiResponse: {
        type: "update",
        category: data.frontmatter.category,
        matchedArticleId: data.frontmatter.id,
        suggestedTitle: data.frontmatter.title,
        suggestedSlug: segs[1] ?? "",
        suggestedContent: data.body,
        diffBefore: "",
        diffAfter: data.body,
        reasoning: "Manueller Edit aus Library, als Draft gespeichert.",
      },
      createdBy: email,
      createdAt: Date.now(),
      status: "pending",
      source: "library",
    });
    return new Response(JSON.stringify({ draftId: id }), { headers: { "Content-Type": "application/json" } });
  }

  // /api/admin/library  → new article
  if (segs.length === 0) {
    const cat = data.frontmatter.category;
    const slug = slugify(data.frontmatter.title);
    const path = `src/content/articles/${cat}/${data.frontmatter.id}-${slug}.md`;
    const content = serializeFrontmatter(data.frontmatter, data.body);
    await commitFile({ path, content, message: `KB: ${data.frontmatter.title} (new) — via admin` });
    await logAudit({ email, action: "publish-new", slug: path });
    return new Response(JSON.stringify({ ok: true, path }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "bad_path" }), { status: 400 });
};

function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
