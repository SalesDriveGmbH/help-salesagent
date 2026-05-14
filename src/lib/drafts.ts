import { kv } from "@vercel/kv";

const DRAFT_TTL = 60 * 60 * 24 * 30; // 30 days

export type DraftSource = "manual" | "intercom" | "library";

export interface DraftAIResponse {
  type: "new" | "update";
  category: string;
  matchedArticleId: string | null;
  suggestedTitle: string;
  suggestedSlug: string;
  suggestedContent: string;
  diffBefore?: string;
  diffAfter?: string;
  reasoning?: string;
}

export interface Draft {
  id: string;
  note: string;
  aiResponse: DraftAIResponse;
  createdBy: string;
  createdAt: number;
  status: "pending" | "published" | "discarded";
  source: DraftSource;
}

const INDEX_KEY = "drafts:index";

export async function saveDraft(d: Omit<Draft, "id">): Promise<string> {
  const id = crypto.randomUUID();
  const draft: Draft = { ...d, id };
  await kv.set(`draft:${id}`, draft, { ex: DRAFT_TTL });
  await kv.sadd(INDEX_KEY, id);
  return id;
}

export async function getDraft(id: string): Promise<Draft | null> {
  return (await kv.get(`draft:${id}`)) as Draft | null;
}

export async function listDrafts(): Promise<Draft[]> {
  let ids: string[] = [];
  try {
    ids = (await kv.smembers(INDEX_KEY)) as string[];
  } catch {
    return [];
  }
  if (!ids.length) return [];
  const drafts: Draft[] = [];
  for (const id of ids) {
    const d = await getDraft(id);
    if (d) drafts.push(d);
    else await kv.srem(INDEX_KEY, id);
  }
  return drafts.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteDraft(id: string): Promise<void> {
  await kv.del(`draft:${id}`);
  await kv.srem(INDEX_KEY, id);
}

export async function markPublished(id: string): Promise<void> {
  const d = await getDraft(id);
  if (!d) return;
  d.status = "published";
  await kv.set(`draft:${id}`, d, { ex: 60 * 60 * 24 }); // 1 day retention post-publish
  await kv.srem(INDEX_KEY, id);
}

export async function logAudit(entry: { email: string; action: string; slug: string; diff?: string }) {
  const key = `audit:${Date.now()}:${crypto.randomUUID()}`;
  await kv.set(key, entry, { ex: 60 * 60 * 24 * 90 }).catch(() => {});
}
