import { useEffect, useState } from "react";
import type { ReviewCardData } from "./ReviewCard";

interface DraftItem {
  id: string;
  source: string;
  createdAt: number;
  note: string;
  aiResponse: any;
}

export default function PendingReviews({ onReview }: { onReview: (d: ReviewCardData) => void }) {
  const [drafts, setDrafts] = useState<DraftItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/drafts")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setDrafts(data.drafts ?? []))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <div className="card p-6 text-sm" style={{ color: "#E3A66A" }}>Fehler: {error}</div>;
  }
  if (!drafts) {
    return <div className="card p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>Lade Drafts …</div>;
  }
  if (!drafts.length) {
    return <div className="card p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>Keine offenen Drafts. Saubere Inbox.</div>;
  }

  return (
    <div className="space-y-3">
      {drafts.map((d) => (
        <button
          key={d.id}
          onClick={() => onReview({
            draftId: d.id,
            type: d.aiResponse.type,
            category: d.aiResponse.category,
            matchedArticleId: d.aiResponse.matchedArticleId ?? null,
            suggestedTitle: d.aiResponse.suggestedTitle,
            suggestedSlug: d.aiResponse.suggestedSlug,
            suggestedContent: d.aiResponse.suggestedContent,
            diffBefore: d.aiResponse.diffBefore,
            diffAfter: d.aiResponse.diffAfter,
            note: d.note,
            source: d.source,
          })}
          className="card block w-full p-5 text-left transition-transform hover:translate-y-[-1px]"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            <span className="font-mono">{d.id.slice(0, 8)}</span>
            <span>·</span>
            <span>{new Date(d.createdAt).toLocaleString("de-DE")}</span>
            <span>·</span>
            <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border-subtle)" }}>{d.source}</span>
            <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border-subtle)" }}>
              {d.aiResponse.type === "new" ? "Neuer Artikel" : "Update"}
            </span>
          </div>
          <div className="mt-2 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {d.aiResponse.suggestedTitle ?? "(ohne Titel)"}
          </div>
          <div className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{d.note.slice(0, 200)}</div>
        </button>
      ))}
    </div>
  );
}
