import { useEffect, useRef, useState } from "react";

interface Message { role: "user" | "assistant"; content: string }

interface Props {
  chatHistory: Message[];
  onClose: () => void;
}

declare global {
  interface Window {
    turnstile?: any;
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY =
  typeof import.meta !== "undefined" && (import.meta as any).env?.PUBLIC_TURNSTILE_SITE_KEY
    ? (import.meta as any).env.PUBLIC_TURNSTILE_SITE_KEY
    : "";

export default function EscalationModal({ chatHistory, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const hasChatContext = chatHistory.length > 1; // mehr als nur die Begrüßung von Sandy

  useEffect(() => {
    if (!SITE_KEY) return;
    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: (t: string) => setToken(t),
      });
    };
    if (window.turnstile) {
      renderWidget();
    } else {
      window.onTurnstileLoad = renderWidget;
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Name und Email sind Pflichtfelder.");
      return;
    }
    if (!hasChatContext && !message.trim()) {
      setError("Beschreib uns kurz dein Anliegen.");
      return;
    }
    if (SITE_KEY && !token) {
      setError("Bitte den Bot-Schutz bestätigen.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message: message.trim() || undefined,
          turnstileToken: token,
          chatHistory,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        if (res.status === 429) {
          throw new Error("Du hast heute schon ein Ticket eröffnet. Probier es morgen erneut oder schreib an office@salesagent.at.");
        }
        const detail = (data as any).detail ? ` — ${(data as any).detail}` : "";
        throw new Error(`${(data as any).error ?? `HTTP ${res.status}`}${detail}`);
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="escalation-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="escalation-panel w-full max-w-md rounded-lg p-6">
        {done ? (
          <div>
            <h3 className="h-display text-2xl" style={{ color: "var(--color-text-primary)" }}>Danke!</h3>
            <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Wir haben dein Anliegen erhalten und melden uns innerhalb von 24 h an Werktagen per Email an <strong style={{ color: "var(--color-gold-light)" }}>{email}</strong>.
            </p>
            <button onClick={onClose} className="btn btn-primary mt-6 w-full">Schließen</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="h-display text-xl" style={{ color: "var(--color-text-primary)" }}>An Support eskalieren</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  {hasChatContext
                    ? "Wir leiten den Chat zusammen mit deinen Kontaktdaten weiter."
                    : "Wir melden uns innerhalb von 24 h an Werktagen per Email."}
                </p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 transition-colors hover:bg-white/5 rounded" style={{ color: "var(--color-text-tertiary)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                Worum geht's? {hasChatContext ? "(optional)" : "*"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={hasChatContext
                  ? "Falls du noch was ergänzen willst …"
                  : "Beschreib uns kurz dein Anliegen …"}
                className="input"
                rows={4}
                style={{ resize: "vertical", minHeight: 90 }}
                required={!hasChatContext}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>Telefon (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </div>

            {SITE_KEY && <div ref={turnstileRef} />}

            {error && (
              <div className="rounded-lg border p-3 text-xs" style={{ borderColor: "rgba(227,166,106,0.30)", background: "rgba(227,166,106,0.05)", color: "#E3A66A" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-50">
              {submitting ? "Wird gesendet …" : "Ticket eröffnen"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
