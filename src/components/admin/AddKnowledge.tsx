import { useState } from "react";
import type { ReviewCardData } from "./ReviewCard";

const EXAMPLES = [
  "Ab Juli ist die Konversionsrate 1:80 statt 1:100",
  "Neues Tool für Lead-Anreicherung: Triangility Pro. Login unter …",
  "Telefonbereitschaft an Feiertagen: …",
];

export default function AddKnowledge({ onReview }: { onReview: (data: ReviewCardData) => void }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
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
    </div>
  );
}
