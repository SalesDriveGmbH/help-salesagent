import { useEffect, useMemo, useState } from "react";
import MarkdownEditor from "./MarkdownEditor";

interface CategoryMeta { slug: string; title: string; description: string; icon: string }
interface ArticleSummary { id: string; title: string; category: string; slug: string; firstParagraph: string; status: string }

interface Frontmatter {
  id: string;
  title: string;
  category: string;
  status: "complete" | "partial" | "todo";
  keywords: string[];
  related: string[];
  last_updated: string;
  faq_priority: number;
  tldr?: string;
}

interface ArticleFull {
  frontmatter: Frontmatter;
  body: string;
  slug: string;
}

type Mode = "read" | "edit" | "new";

export default function Library({ categories, articles, onReview: _onReview }: { categories: CategoryMeta[]; articles: ArticleSummary[]; onReview: (d: any) => void }) {
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "partial" | "todo">("all");
  const [q, setQ] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => Object.fromEntries(categories.map((c) => [c.slug, true])));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleFull | null>(null);
  const [mode, setMode] = useState<Mode>("read");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ sha: string; message: string; date: string }> | null>(null);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        if (!a.title.toLowerCase().includes(needle) && !a.id.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [articles, statusFilter, q]);

  const byCat = useMemo(() => {
    const map: Record<string, ArticleSummary[]> = {};
    for (const a of filtered) (map[a.category] ??= []).push(a);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.id.localeCompare(b.id));
    return map;
  }, [filtered]);

  useEffect(() => {
    if (!selectedKey) return;
    setArticle(null);
    setHistory(null);
    setMode("read");
    fetch(`/api/admin/library/${selectedKey}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setArticle)
      .catch((e) => setFeedback("Fehler: " + e.message));
  }, [selectedKey]);

  function openNew() {
    setSelectedKey(null);
    setArticle({
      slug: "",
      frontmatter: {
        id: nextId(articles),
        title: "Neuer Artikel",
        category: "abrechnung",
        status: "partial",
        keywords: [],
        related: [],
        last_updated: new Date().toISOString().slice(0, 10),
        faq_priority: 50,
        tldr: "",
      },
      body: "## Einleitung\n\nHier den Artikel schreiben.\n",
    });
    setMode("new");
  }

  async function save(asDraft: boolean) {
    if (!article) return;
    const path = mode === "new"
      ? "/api/admin/library"
      : `/api/admin/library/${article.frontmatter.category}/${article.slug}${asDraft ? "/draft" : ""}`;
    const method = mode === "new" ? "POST" : (asDraft ? "POST" : "PUT");
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      setFeedback(asDraft ? "Als Draft gespeichert — siehe Pending Reviews." : "Veröffentlicht — live in ~30 s.");
      if (!asDraft) setTimeout(() => location.reload(), 1200);
    } catch (e: any) {
      setFeedback("Fehler: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!confirm("Sicher? Geht ohne Review direkt live.")) return;
    await save(false);
  }

  async function loadHistory() {
    if (!article || mode === "new") return;
    try {
      const res = await fetch(`/api/admin/library/${article.frontmatter.category}/${article.slug}/history`);
      const data = await res.json();
      setHistory(data.commits ?? []);
    } catch (e: any) {
      setFeedback("History-Fehler: " + e.message);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
        <div className="card p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Suchen …" className="input mb-3" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input mb-3">
            <option value="all">Alle Status</option>
            <option value="complete">Complete</option>
            <option value="partial">Partial</option>
            <option value="todo">TODO</option>
          </select>
          <button onClick={openNew} className="btn btn-primary w-full">+ Neuer Artikel</button>
        </div>

        <div className="mt-4 space-y-1">
          {categories.map((cat) => {
            const list = byCat[cat.slug] ?? [];
            return (
              <div key={cat.slug}>
                <button
                  onClick={() => setOpenCats((s) => ({ ...s, [cat.slug]: !s[cat.slug] }))}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs uppercase tracking-[0.16em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  <span>{openCats[cat.slug] ? "▼" : "▶"} {cat.title} ({list.length})</span>
                </button>
                {openCats[cat.slug] && (
                  <ul className="mt-1 space-y-0.5">
                    {list.map((a) => {
                      const key = `${a.category}/${a.slug}`;
                      const active = selectedKey === key;
                      return (
                        <li key={key}>
                          <button
                            onClick={() => setSelectedKey(key)}
                            className={`block w-full truncate rounded-md px-3 py-1.5 text-left text-sm transition-colors ${active ? "" : "hover:bg-white/5"}`}
                            style={active ? { background: "rgba(191,163,124,0.10)", color: "var(--color-gold-light)", borderLeft: "2px solid var(--color-gold-primary)" } : { color: "var(--color-text-secondary)" }}
                          >
                            <span className="font-mono text-xs mr-2" style={{ color: "var(--color-text-tertiary)" }}>{a.id}</span>
                            <span>{a.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <main className="min-w-0">
        {!article && (
          <div className="card p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Wähle links einen Artikel oder lege einen neuen an.
          </div>
        )}
        {article && (
          <div className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                <span>Library</span>
                <span>/</span>
                <span>{article.frontmatter.category}</span>
                <span>/</span>
                <span className="font-mono" style={{ color: "var(--color-text-secondary)" }}>{article.frontmatter.id}</span>
                <span className={`badge badge-${article.frontmatter.status}`}>{article.frontmatter.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {mode !== "new" && (
                  <button onClick={() => setMode(mode === "read" ? "edit" : "read")} className="btn btn-ghost">
                    {mode === "read" ? "✏️ Bearbeiten" : "📖 Lesen"}
                  </button>
                )}
              </div>
            </div>

            <FrontmatterForm
              fm={article.frontmatter}
              onChange={(next) => setArticle({ ...article, frontmatter: next })}
              editable={mode !== "read"}
              articles={articles}
            />

            <div className="mt-6">
              {mode === "read" ? (
                <pre className="whitespace-pre-wrap text-sm" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", lineHeight: 1.65 }}>{article.body}</pre>
              ) : (
                <MarkdownEditor value={article.body} onChange={(v) => setArticle({ ...article, body: v })} height={420} />
              )}
            </div>

            {feedback && (
              <div className="mt-4 rounded-lg border p-3 text-xs" style={{ borderColor: "var(--color-border-default)", background: "rgba(191,163,124,0.06)", color: "var(--color-gold-light)" }}>
                {feedback}
              </div>
            )}

            {mode !== "read" && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                {mode === "edit" ? (
                  <button onClick={loadHistory} className="text-xs underline" style={{ color: "var(--color-text-tertiary)" }} type="button">
                    Frühere Versionen anzeigen
                  </button>
                ) : <span />}
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => save(true)} disabled={busy} className="btn btn-ghost disabled:opacity-50">💾 Als Draft speichern</button>
                  <button onClick={publish} disabled={busy} className="btn btn-primary disabled:opacity-50">🚀 Direkt veröffentlichen</button>
                </div>
              </div>
            )}

            {history && history.length > 0 && (
              <div className="mt-6 rounded-lg border p-4" style={{ borderColor: "var(--color-border-subtle)", background: "rgba(14,14,14,0.5)" }}>
                <div className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Letzte Commits</div>
                <ul className="mt-2 space-y-1 text-xs">
                  {history.map((h) => (
                    <li key={h.sha} className="flex items-center justify-between gap-3">
                      <span style={{ color: "var(--color-text-secondary)" }}>{h.message}</span>
                      <span className="font-mono" style={{ color: "var(--color-text-tertiary)" }}>{h.sha.slice(0, 7)} · {new Date(h.date).toLocaleDateString("de-DE")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FrontmatterForm({ fm, onChange, editable, articles }: { fm: Frontmatter; onChange: (n: Frontmatter) => void; editable: boolean; articles: ArticleSummary[] }) {
  if (!editable) {
    return (
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg border p-4 sm:grid-cols-2" style={{ borderColor: "var(--color-border-subtle)", background: "rgba(14,14,14,0.5)" }}>
        <div className="text-xs"><span style={{ color: "var(--color-text-tertiary)" }}>Titel:</span> <strong style={{ color: "var(--color-text-primary)" }}>{fm.title}</strong></div>
        <div className="text-xs"><span style={{ color: "var(--color-text-tertiary)" }}>Last Updated:</span> {fm.last_updated}</div>
        <div className="text-xs"><span style={{ color: "var(--color-text-tertiary)" }}>FAQ Priority:</span> {fm.faq_priority}</div>
        <div className="text-xs"><span style={{ color: "var(--color-text-tertiary)" }}>Keywords:</span> {fm.keywords.join(", ")}</div>
        <div className="col-span-full text-xs"><span style={{ color: "var(--color-text-tertiary)" }}>Related:</span> {fm.related.join(", ")}</div>
        {fm.tldr && <div className="col-span-full text-xs"><span style={{ color: "var(--color-text-tertiary)" }}>TL;DR:</span> {fm.tldr}</div>}
      </div>
    );
  }

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2" style={{ borderColor: "var(--color-border-subtle)", background: "rgba(14,14,14,0.5)" }}>
      <div>
        <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Titel</label>
        <input value={fm.title} onChange={(e) => onChange({ ...fm, title: e.target.value })} className="input" />
      </div>
      <div>
        <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Status</label>
        <select value={fm.status} onChange={(e) => onChange({ ...fm, status: e.target.value as any })} className="input">
          <option value="complete">complete</option>
          <option value="partial">partial</option>
          <option value="todo">todo</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Kategorie</label>
        <select value={fm.category} onChange={(e) => onChange({ ...fm, category: e.target.value })} className="input">
          {["abrechnung","technik","projekt","vertrag","ausbildung","community"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>FAQ Priority</label>
        <input type="number" min={1} max={99} value={fm.faq_priority} onChange={(e) => onChange({ ...fm, faq_priority: Number(e.target.value) })} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>TL;DR</label>
        <input value={fm.tldr ?? ""} onChange={(e) => onChange({ ...fm, tldr: e.target.value })} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Keywords (Komma-getrennt)</label>
        <input value={fm.keywords.join(", ")} onChange={(e) => onChange({ ...fm, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Related (Artikel-IDs, Komma-getrennt)</label>
        <input
          value={fm.related.join(", ")}
          onChange={(e) => onChange({ ...fm, related: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          className="input"
          list="article-ids"
        />
        <datalist id="article-ids">
          {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </datalist>
      </div>
    </div>
  );
}

function nextId(articles: ArticleSummary[]): string {
  const prefixes = articles.map((a) => a.id.match(/^([A-Z]+)/)?.[1]).filter(Boolean) as string[];
  const used = new Set(articles.map((a) => a.id));
  for (const p of ["X", "Z", "N"]) {
    for (let i = 1; i < 100; i++) {
      const id = `${p}${String(i).padStart(2, "0")}`;
      if (!used.has(id)) return id;
    }
  }
  return `X${Date.now().toString().slice(-4)}`;
}
