import { INTERCOM_TAG_IDS, type IntercomCategory } from "./intercom-tags";

const BASE = "https://api.intercom.io";

function headers() {
  return {
    Authorization: `Bearer ${import.meta.env.INTERCOM_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Intercom-Version": "2.11",
  };
}

function formatConversationBody(params: {
  name: string;
  email: string;
  phone?: string;
  summary: string;
  category: IntercomCategory;
  chatHistory: Array<{ role: string; content: string }>;
}): string {
  const lines: string[] = [];
  lines.push(`<p><strong>${escapeHtml(params.summary)}</strong></p>`);
  lines.push(`<hr/>`);
  lines.push(`<p><strong>Kontakt:</strong><br/>${escapeHtml(params.name)} &lt;${escapeHtml(params.email)}&gt;${params.phone ? `<br/>📞 ${escapeHtml(params.phone)}` : ""}</p>`);
  lines.push(`<p><strong>Kategorie:</strong> ${params.category}</p>`);
  lines.push(`<p><strong>Chat-Verlauf:</strong></p>`);
  lines.push(`<blockquote>`);
  for (const m of params.chatHistory) {
    const role = m.role === "user" ? "👤 Agent" : "🤖 Sandy";
    lines.push(`<p><strong>${role}:</strong> ${escapeHtml(m.content)}</p>`);
  }
  lines.push(`</blockquote>`);
  return lines.join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function createIntercomConversation(params: {
  name: string;
  email: string;
  phone?: string;
  summary: string;
  category: IntercomCategory;
  chatHistory: Array<{ role: string; content: string }>;
}) {
  // 1. Find or create contact
  const searchRes = await fetch(`${BASE}/contacts/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      query: { field: "email", operator: "=", value: params.email },
    }),
  });
  if (!searchRes.ok) throw new Error(`Intercom contact search: ${searchRes.status} ${await searchRes.text()}`);
  const found = (await searchRes.json()) as any;

  // Phone nur dann mitsenden, wenn nicht leer/whitespace — Intercom validiert sonst zu hart
  const phoneTrimmed = (params.phone ?? "").trim();
  const phoneField = phoneTrimmed ? { phone: phoneTrimmed } : {};

  let contactId: string;
  if (found.data?.length > 0) {
    contactId = found.data[0].id;
    await fetch(`${BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ name: params.name, ...phoneField }),
    });
  } else {
    const createRes = await fetch(`${BASE}/contacts`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        role: "user",
        name: params.name,
        email: params.email,
        ...phoneField,
      }),
    });
    if (!createRes.ok) throw new Error(`Intercom contact create: ${createRes.status} ${await createRes.text()}`);
    contactId = ((await createRes.json()) as any).id;
  }

  // 2. Create conversation
  const body = formatConversationBody(params);
  const convRes = await fetch(`${BASE}/conversations`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ from: { type: "user", id: contactId }, body }),
  });
  if (!convRes.ok) throw new Error(`Intercom conversation create: ${convRes.status} ${await convRes.text()}`);
  const conversation = (await convRes.json()) as any;

  // 3. Add tag (still skip when ID missing)
  const tagId = INTERCOM_TAG_IDS[params.category] || INTERCOM_TAG_IDS.sonstiges;
  const adminId = import.meta.env.INTERCOM_ADMIN_ID;
  if (tagId && adminId) {
    await fetch(`${BASE}/conversations/${conversation.id}/tags`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ id: tagId, admin_id: adminId }),
    }).catch((e) => console.warn("Intercom tag attach failed:", e));
  }

  return conversation;
}

export async function fetchClosedConversations(limit = 50) {
  const res = await fetch(`${BASE}/conversations/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      query: { field: "state", operator: "=", value: "closed" },
      pagination: { per_page: limit },
      sort: { field: "updated_at", order: "descending" },
    }),
  });
  if (!res.ok) throw new Error(`Intercom search: ${res.status}`);
  const data = (await res.json()) as any;
  return data.conversations ?? [];
}

export async function fetchConversationFull(id: string) {
  const res = await fetch(`${BASE}/conversations/${id}?display_as=plaintext`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Intercom get conversation: ${res.status}`);
  return (await res.json()) as any;
}
