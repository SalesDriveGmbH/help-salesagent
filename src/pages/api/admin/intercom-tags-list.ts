import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Listet alle Intercom-Tags samt IDs auf.
 * Auth-protected via Middleware (/api/admin/*).
 * Einmaliges Helper-Endpoint zum Befüllen von src/lib/intercom-tags.ts.
 */
export const GET: APIRoute = async () => {
  const token = import.meta.env.INTERCOM_ACCESS_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify(
        {
          error: "INTERCOM_ACCESS_TOKEN nicht gesetzt",
          hint: "Trag den Token in Vercel → Settings → Environment Variables ein und mach einen Redeploy.",
        },
        null,
        2,
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch("https://api.intercom.io/tags", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Intercom-Version": "2.11",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      return new Response(
        JSON.stringify({ error: `Intercom API: ${res.status}`, body }, null, 2),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = (await res.json()) as any;
    const tags = (data.data ?? []).map((t: any) => ({ name: t.name, id: t.id }));

    return new Response(JSON.stringify({ tags }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "fetch failed" }, null, 2),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
