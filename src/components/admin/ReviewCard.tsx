import { useState } from "react";
import MarkdownEditor from "./MarkdownEditor";

export interface ReviewCardData {
  draftId: string;
  type: "new" | "update";
  category: string;
  matchedArticleId?: string | null;
  suggestedTitle: string;
  suggestedSlug: string;
  suggestedContent: string;
  diffBefore?: string;
  diffAfter?: string;
  note?: string;
  source?: string;
}

interface ArticleSummary { id: string; title: string; category: string; slug: string }

interface Props {
  data: ReviewCardData;
  articles: ArticleSummary[];
  onClose: () => void;
  onPublished: () => void;
}

const CATS = ["abrechnung", "technik", "projekt", "vertrag", "ausbildung", "community"];

export default function ReviewCard({ data, articles, onClose, onPublished }: Props) {
  const [title, setTitle] = useState(data.suggestedTitle);
  const [slug, setSlug] = useState(data.suggestedSlug);
  const [category, setCategory] = useState(data.category);
  const [content, setContent] = useState(data.suggestedContent);
  const [diffBefore, setDiffBefore] = useState(data.diffBefore ?? "");
  const [diffAfter, setDiffAfter] = useState(data.diffAfter ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matched = data.matchedArticleId ? articles.find((a) => a.id === data.matchedArticleId) : null;

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: data.draftId,
          finalContent: {
            type: data.type,
            category,
            title,
            slug,
            content,
            diffBefore: data.type === "update" ? diffBefore : undefined,
            diffAfter: data.type === "update" ? diffAfter : undefined,
            matchedArticleId: data.matchedArticleId,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      onPublished();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    if (!confirm("Draft verwerfen?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/drafts?id=${encodeURIComponent(data.draftId)}`, { method: "DELETE" });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border-subtle)" }}>
              {data.type === "new" ? "Neuer Artikel" : "Update"}
            </span>
            {matched && (
              <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border-subtle)" }}>
                zu {matched.id} — {matched.title}
              </span>
            )}
            {data.source && (
              <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border-subtle)" }}>
                Quelle: {data.source}
              </span>
            )}
          </div>
          <h3 className="h-display mt-2 text-2xl" style={{ color: "var(--color-text-primary)" }}>
            Review & Publish
          </h3>
        </div>
        <button onClick={onClose} className="btn btn-ghost">← Zurück</button>
      </div>

      {data.note && (
        <details className="mb-5 rounded-lg border p-3 text-xs" style={{ borderColor: "var(--color-border-subtle)", background: "rgba(14,14,14,0.5)" }}>
          <summary className="cursor-pointer" style={{ color: "var(--color-text-tertiary)" }}>Original-Notiz / Quelle</summary>
          <pre className="mt-2 whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{data.note}</pre>
        </details>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Kategorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Titel</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" style={{ fontFamily: "var(--font-mono)" }} />
        </div>
      </div>

      {data.type === "update" ? (
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Block VORHER (exakter Text, der ersetzt wird)</label>
            <textarea
              value={diffBefore}
              onChange={(e) => setDiffBefore(e.target.value)}
              className="input"
              style={{ minHeight: 120, fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Block NACHHER (neuer Text)</label>
            <MarkdownEditor value={diffAfter} onChange={setDiffAfter} height={300} />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Artikel-Inhalt (Markdown)</label>
          <MarkdownEditor value={content} onChange={setContent} height={420} />
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border p-3 text-xs" style={{ borderColor: "rgba(227,166,106,0.30)", background: "rgba(227,166,106,0.05)", color: "#E3A66A" }}>
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <button onClick={discard} disabled={busy} className="btn btn-ghost disabled:opacity-50">Discard</button>
        <button onClick={publish} disabled={busy} className="btn btn-primary disabled:opacity-50">
          {busy ? "Veröffentliche …" : "Approve & Publish"}
        </button>
      </div>
    </div>
  );
}
