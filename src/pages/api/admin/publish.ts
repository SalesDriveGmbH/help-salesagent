import type { APIRoute } from "astro";
import { getDraft, deleteDraft, logAudit } from "../../../lib/drafts";
import { getFile, commitFile } from "../../../lib/github";
import { parseFrontmatter, serializeFrontmatter, type Frontmatter } from "../../../lib/frontmatter";

export const prerender = false;

function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const POST: APIRoute = async ({ request, locals }) => {
  const email = locals.adminEmail ?? "unknown@admin";
  const { draftId, finalContent } = await request.json().catch(() => ({}));
  if (!draftId || !finalContent) return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });

  const draft = await getDraft(draftId);
  if (!draft) return new Response(JSON.stringify({ error: "draft_not_found" }), { status: 404 });

  const { type, category, title, slug: rawSlug, content, diffBefore, diffAfter, matchedArticleId } = finalContent;
  const slug = slugify(rawSlug || title);

  try {
    if (type === "new") {
      const id = draft.aiResponse?.matchedArticleId ?? autoId(category);
      const fm: Frontmatter = {
        id,
        title,
        category,
        status: "partial",
        keywords: [],
        related: [],
        last_updated: new Date().toISOString().slice(0, 10),
        faq_priority: 50,
        tldr: undefined,
      };
      const path = `src/content/articles/${category}/${id}-${slug}.md`;
      const fileContent = serializeFrontmatter(fm, content);
      await commitFile({
        path,
        content: fileContent,
        message: `KB: ${title} (new) — via admin`,
      });
      await logAudit({ email, action: "publish-new", slug: path });
    } else {
      // update — find the file by matchedArticleId
      const targetId = matchedArticleId ?? draft.aiResponse?.matchedArticleId;
      if (!targetId) return new Response(JSON.stringify({ error: "missing_matched_article_id" }), { status: 400 });
      const path = await findArticlePath(targetId, category);
      if (!path) return new Response(JSON.stringify({ error: "article_not_found_in_repo" }), { status: 404 });

      const existing = await getFile(path);
      if (!existing) return new Response(JSON.stringify({ error: "article_file_missing" }), { status: 404 });
      const { frontmatter, body } = parseFrontmatter(existing.content);
      const newBody = diffBefore && body.includes(diffBefore)
        ? body.replace(diffBefore, diffAfter ?? "")
        : `${body.trimEnd()}\n\n${diffAfter ?? content ?? ""}\n`;
      frontmatter.last_updated = new Date().toISOString().slice(0, 10);
      const updated = serializeFrontmatter(frontmatter, newBody);
      await commitFile({
        path,
        content: updated,
        message: `KB: ${frontmatter.title} (update) — via admin`,
        sha: existing.sha,
      });
      await logAudit({ email, action: "publish-update", slug: path, diff: diffAfter });
    }

    await deleteDraft(draftId);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "publish_failed" }), { status: 500 });
  }
};

function autoId(category: string): string {
  const prefix = {
    abrechnung: "A",
    technik: "T",
    projekt: "P",
    vertrag: "V",
    ausbildung: "S",
    community: "K",
  }[category as string] ?? "X";
  return `${prefix}${String(Date.now()).slice(-3)}`;
}

async function findArticlePath(articleId: string, category: string): Promise<string | null> {
  // Use GitHub tree search via list-content; pragmatic approach: list category dir
  const owner = import.meta.env.GITHUB_REPO_OWNER;
  const repo = import.meta.env.GITHUB_REPO_NAME;
  const token = import.meta.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) return null;
  const dirRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articles/${category}?ref=main`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
  );
  if (!dirRes.ok) return null;
  const entries = (await dirRes.json()) as any[];
  const hit = entries.find((e) => typeof e.name === "string" && e.name.startsWith(`${articleId}-`));
  return hit?.path ?? null;
}
