import type { APIRoute } from "astro";
import { kv } from "@vercel/kv";

export const prerender = false;

const KEY = "ins:no-result";

export const GET: APIRoute = async () => {
  try {
    const raw = await kv.zrange(KEY, 0, 9, { rev: true, withScores: true }) as Array<string | number>;
    const items: Array<{ query: string; count: number }> = [];
    for (let i = 0; i < raw.length; i += 2) {
      items.push({ query: String(raw[i]), count: Number(raw[i + 1]) });
    }
    return new Response(JSON.stringify({ items }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ items: [], error: e?.message }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const q = url.searchParams.get("q");
  if (!q) return new Response(JSON.stringify({ error: "missing_query" }), { status: 400 });
  try {
    await kv.zrem(KEY, q);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message }), { status: 500 });
  }
};
