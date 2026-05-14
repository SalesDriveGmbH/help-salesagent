import type { APIRoute } from "astro";
import { fetchClosedConversations } from "../../../lib/intercom";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const conversations = await fetchClosedConversations(50);
    const mapped = conversations.map((c: any) => ({
      id: c.id,
      updated_at: c.updated_at,
      contact_name: c?.contacts?.contacts?.[0]?.name,
      contact_email: c?.contacts?.contacts?.[0]?.email,
      subject: c?.source?.subject || c?.title,
      preview: (c?.source?.body ?? "").replace(/<[^>]+>/g, "").slice(0, 140),
      tag: c?.tags?.tags?.[0]?.name,
    }));
    return new Response(JSON.stringify({ conversations: mapped }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "intercom_failed" }), { status: 502 });
  }
};
