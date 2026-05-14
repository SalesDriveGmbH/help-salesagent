import { useEffect, useState } from "react";
import type { ReviewCardData } from "./ReviewCard";

const EXAMPLES = [
  "Ab Juli ist die Konversionsrate 1:80 statt 1:100",
  "Neues Tool für Lead-Anreicherung: Triangility Pro. Login unter …",
  "Telefonbereitschaft an Feiertagen: …",
];

interface NoResultItem {
  query: string;
  count: number;
}

export default function AddKnowledge({ onReview }: { onReview: (data: ReviewCardData) => void }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaps, setGaps] = useState<NoResultItem[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/no-result-queries")
      .then((r) => r.json())
      .then((data) => setGaps(data.items ?? []))
      .catch(() => setGaps([]));
  }, []);

  async function submit() {
    if (!note.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.type === "skip") {
        setError(data.reasoning ?? "Nicht generalisierbar — übersprungen.");
        return;
      }
      onReview(data);
      setNote("");
    } catch (e: any) {
      setError(e.message ?? "Fehler");
    } finally {
      setLoading(false);
    }
  }

  function dismissGap(query: string) {
    fetch(`/api/admin/no-result-queries?q=${encodeURIComponent(query)}`, { method: "DELETE" });
    setGaps((prev) => (prev ?? []).filter((g) => g.query !== query));
  }

  return (
    <div className="space-y-6">
      {gaps && gaps.length > 0 && (
        <div className="rounded-md border p-5" style={{ borderColor: "var(--color-border-default)", background: "linear-gradient(135deg, rgba(227,166,106,0.06) 0%, rgba(227,166,106,0.01) 100%)" }}>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.16em]" style={{ color: "#E3A66A" }}>KB-Lücken — direkt aus Suchen ohne Treffer</div>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Klick auf eine Lücke, um sie als Notiz vorzubefüllen — Sandy schlägt dann passende Inhalte vor.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {gaps.slice(0, 6).map((g) => (
              <div key={g.query} className="gap-chip">
                <button
                  type="button"
                  className="gap-chip__main"
                  onClick={() => setNote(`Es fehlt ein Artikel zum Thema „${g.query}". Worauf bezieht sich das genau? Schreib hier die Antwort hin, Sandy formt daraus einen Artikel.`)}
                >
                  <span className="gap-chip__q">{g.query}</span>
                  <span className="gap-chip__count">× {g.count}</span>
                </button>
                <button
                  type="button"
                  className="gap-chip__dismiss"
                  onClick={() => dismissGap(g.query)}
                  title="Aus der Liste entfernen"
                  aria-label="Entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <label className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>
          Was gibt's Neues?
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Eine kurze Notiz, ein Slack-Snippet, eine Klarstellung von Lukas … die AI klassifiziert und schlägt einen neuen oder aktualisierten Artikel vor."
          className="input mt-3"
          style={{ minHeight: 160, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 14, lineHeight: 1.6 }}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          <span>Beispiele:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setNote(ex)}
              className="rounded-full border px-2.5 py-1 transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border p-3 text-xs" style={{ borderColor: "rgba(227,166,106,0.30)", background: "rgba(227,166,106,0.05)", color: "#E3A66A" }}>
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button onClick={submit} disabled={loading || !note.trim()} className="btn btn-primary disabled:opacity-50">
            {loading ? "AI analysiert …" : "→ AI analysieren"}
          </button>
        </div>
      </div>

      <style>{`
        .gap-chip {
          display: inline-flex;
          align-items: stretch;
          border-radius: 999px;
          border: 1px solid rgba(227, 166, 106, 0.25);
          background: color-mix(in srgb, rgba(227, 166, 106, 0.08) 80%, transparent);
          overflow: hidden;
          transition: border-color 180ms ease, transform 180ms ease;
        }
        .gap-chip:hover { border-color: rgba(227, 166, 106, 0.5); transform: translateY(-1px); }
        .gap-chip__main {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.8rem;
          background: transparent;
          border: 0;
          color: var(--color-text-primary);
          font-size: 0.8rem;
          cursor: pointer;
        }
        .gap-chip__q { font-weight: 500; }
        .gap-chip__count { color: var(--color-text-tertiary); font-size: 0.7rem; font-family: var(--font-mono); }
        .gap-chip__dismiss {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          background: transparent;
          border: 0;
          border-left: 1px solid rgba(227, 166, 106, 0.18);
          color: var(--color-text-tertiary);
          font-size: 1rem;
          cursor: pointer;
        }
        .gap-chip__dismiss:hover { color: #E3A66A; }
      `}</style>
    </div>
  );
}
