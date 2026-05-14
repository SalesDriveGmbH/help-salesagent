import type { APIRoute } from "astro";
import { listDrafts, deleteDraft } from "../../../lib/drafts";

export const prerender = false;

export const GET: APIRoute = async () => {
  const drafts = await listDrafts();
  return new Response(JSON.stringify({ drafts }), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "missing_id" }), { status: 400 });
  await deleteDraft(id);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
