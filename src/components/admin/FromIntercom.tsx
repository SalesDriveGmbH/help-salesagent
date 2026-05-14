import { useEffect, useState } from "react";
import type { ReviewCardData } from "./ReviewCard";

interface Conversation {
  id: string;
  updated_at: number;
  contact_name?: string;
  contact_email?: string;
  subject?: string;
  tag?: string;
  preview?: string;
}

export default function FromIntercom({ onReview }: { onReview: (d: ReviewCardData) => void }) {
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/intercom-pull")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setItems(data.conversations ?? []))
      .catch((e) => setError(e.message));
  }, []);

  async function analyze(id: string) {
    setBusy(id);
    setInfo(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/intercom-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.type === "skip") {
        setInfo(`Übersprungen: ${data.reasoning ?? "nicht generalisierbar."}`);
        return;
      }
      onReview(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <div className="card p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        <strong style={{ color: "#E3A66A" }}>Fehler beim Laden:</strong> {error}
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          Prüfe, ob <code>INTERCOM_ACCESS_TOKEN</code> in den Env-Vars gesetzt ist.
        </p>
      </div>
    );
  }

  if (!items) {
    return <div className="card p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>Lade geschlossene Conversations …</div>;
  }

  if (!items.length) {
    return <div className="card p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>Keine geschlossenen Conversations gefunden.</div>;
  }

  return (
    <div className="space-y-3">
      {info && (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--color-border-default)", background: "rgba(191,163,124,0.06)", color: "var(--color-gold-light)" }}>
          {info}
        </div>
      )}
      {items.map((c) => (
        <div key={c.id} className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              <span className="font-mono">{c.id}</span>
              <span>·</span>
              <span>{new Date(c.updated_at * 1000).toLocaleDateString("de-DE")}</span>
              {c.tag && <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border-subtle)" }}>{c.tag}</span>}
            </div>
            <div className="mt-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {c.contact_name ?? c.contact_email ?? "Anonymous"} — {c.subject ?? "(kein Betreff)"}
            </div>
            {c.preview && <div className="mt-1 text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>{c.preview}</div>}
          </div>
          <button onClick={() => analyze(c.id)} disabled={busy === c.id} className="btn btn-ghost disabled:opacity-50">
            {busy === c.id ? "Analysiert …" : "→ KB-Update vorschlagen"}
          </button>
        </div>
      ))}
    </div>
  );
}
