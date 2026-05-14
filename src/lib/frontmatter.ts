export interface Frontmatter {
  id: string;
  title: string;
  category: string;
  status: "complete" | "partial" | "todo";
  keywords: string[];
  related: string[];
  last_updated: string;
  faq_priority: number;
  tldr?: string;
  escalate_to?: string;
  escalate_tag?: string;
}

const FENCE = "---";

export function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== FENCE) {
    return { frontmatter: defaultFrontmatter(), body: raw };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FENCE) { end = i; break; }
  }
  if (end === -1) return { frontmatter: defaultFrontmatter(), body: raw };

  const fmRaw = lines.slice(1, end).join("\n");
  const fm = parseYamlLite(fmRaw);
  const body = lines.slice(end + 1).join("\n").replace(/^\n+/, "");
  return { frontmatter: normalize(fm), body };
}

export function serializeFrontmatter(fm: Frontmatter, body: string): string {
  const ordered: Array<[string, any]> = [
    ["id", fm.id],
    ["title", fm.title],
    ["category", fm.category],
    ["status", fm.status],
    ["keywords", fm.keywords],
    ["related", fm.related],
    ["last_updated", fm.last_updated],
    ["faq_priority", fm.faq_priority],
  ];
  if (fm.tldr) ordered.push(["tldr", fm.tldr]);
  if (fm.escalate_to) ordered.push(["escalate_to", fm.escalate_to]);
  if (fm.escalate_tag) ordered.push(["escalate_tag", fm.escalate_tag]);

  const yaml = ordered.map(([k, v]) => `${k}: ${formatValue(v)}`).join("\n");
  return `---\n${yaml}\n---\n\n${body.replace(/^\n+/, "")}`;
}

function defaultFrontmatter(): Frontmatter {
  return {
    id: "X01",
    title: "Untitled",
    category: "community",
    status: "partial",
    keywords: [],
    related: [],
    last_updated: new Date().toISOString().slice(0, 10),
    faq_priority: 50,
  };
}

function normalize(fm: any): Frontmatter {
  return {
    id: String(fm.id ?? "X01"),
    title: String(fm.title ?? "Untitled"),
    category: String(fm.category ?? "community"),
    status: (["complete", "partial", "todo"].includes(fm.status) ? fm.status : "partial") as Frontmatter["status"],
    keywords: Array.isArray(fm.keywords) ? fm.keywords.map(String) : [],
    related: Array.isArray(fm.related) ? fm.related.map(String) : [],
    last_updated: String(fm.last_updated ?? new Date().toISOString().slice(0, 10)),
    faq_priority: Number(fm.faq_priority ?? 50),
    tldr: fm.tldr ? String(fm.tldr) : undefined,
    escalate_to: fm.escalate_to ? String(fm.escalate_to) : undefined,
    escalate_tag: fm.escalate_tag ? String(fm.escalate_tag) : undefined,
  };
}

function parseYamlLite(src: string): Record<string, any> {
  const out: Record<string, any> = {};
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value: any = m[2].trim();
    if (value === "") {
      // possibly a list with following indented items, but we only support inline arrays here
      out[key] = "";
      continue;
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      out[key] = inner ? inner.split(",").map((s) => stripQuotes(s.trim())) : [];
      continue;
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      out[key] = stripQuotes(value);
      continue;
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      out[key] = Number(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

function stripQuotes(s: string): string {
  return s.replace(/^["']|["']$/g, "");
}

function formatValue(v: any): string {
  if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(String(x))).join(", ")}]`;
  if (typeof v === "number") return String(v);
  return `"${String(v).replace(/"/g, '\\"')}"`;
}
