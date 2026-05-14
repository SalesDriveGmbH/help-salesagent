import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import EscalationModal from "./EscalationModal";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

const QUICK_REPLIES = [
  "Wann werde ich ausbezahlt?",
  "Konversion 1:100 — was passiert wenn ich drunter bin?",
  "Mein Kontoblatt zeigt falsche Zahlen",
  "Wie melde ich fehlende Wählversuche?",
];

const FAIL_PATTERNS = [
  /weiß ich nicht/i,
  /kann ich nicht/i,
  /bin ich mir nicht sicher/i,
  /musst du dich an/i,
];
const USER_FAIL_PATTERNS = [
  /\bnein\b/i,
  /trotzdem/i,
  /passt nicht/i,
  /verstehe ich nicht/i,
  /hilft nicht/i,
];

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! Ich bin Sandy, deine AI-Assistentin. Ich helfe dir bei allem rund um deinen Job als SalesAgent. Was kann ich für dich tun?",
};

const STORAGE_KEY = "sandy:history";

function loadHistory(): Message[] {
  if (typeof window === "undefined") return [INITIAL_MESSAGE];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [INITIAL_MESSAGE];
}

function saveHistory(messages: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>");
  html = html.replace(/<\/ul>\s*<ul>/g, "");
  html = html.replace(/\n\n+/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><(h3|h4|ul|pre)>/g, "<$1>").replace(/<\/(h3|h4|ul|pre)><\/p>/g, "</$1>");
  return html;
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [autoSuggested, setAutoSuggested] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      navigator.sendBeacon?.("/api/track", JSON.stringify({ event: "chat-open" }));
    };
    window.addEventListener("sandy:open", handler);
    return () => window.removeEventListener("sandy:open", handler);
  }, []);

  useEffect(() => {
    if (autoSuggested) return;
    const asstMessages = messages.filter((m) => m.role === "assistant");
    if (asstMessages.length < 3) return;
    const lastThree = asstMessages.slice(-3);
    const failCount = lastThree.filter((m) =>
      FAIL_PATTERNS.some((p) => p.test(m.content)),
    ).length;
    const userMsgs = messages.filter((m) => m.role === "user");
    const lastUser = userMsgs[userMsgs.length - 1]?.content ?? "";
    const userFails = USER_FAIL_PATTERNS.some((p) => p.test(lastUser));
    if (failCount >= 2 || (failCount >= 1 && userFails)) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Soll ich das an unser Support-Team weitergeben? Dann meldet sich jemand direkt bei dir per Email.\n\nKlick auf **„Mit Support reden"** unten — oder antworte mit *„Ja"*.",
        },
      ]);
      setAutoSuggested(true);
    }
  }, [messages, autoSuggested]);

  // Wenn der User nach Auto-Suggestion „Ja"/„Gerne"/„Bitte" schickt → Eskalations-Modal direkt öffnen
  useEffect(() => {
    if (!autoSuggested) return;
    const last = messages[messages.length - 1];
    if (last?.role !== "user") return;
    if (/^\s*(ja|gerne|bitte|ok|okay|yes|jep|jo)\b/i.test(last.content)) {
      setEscalateOpen(true);
    }
  }, [messages, autoSuggested]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let assistantContent = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10) }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `HTTP ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Es gab ein Problem mit der Antwort. Versuch's gleich noch einmal — oder eskaliere direkt an unser Support-Team.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([INITIAL_MESSAGE]);
    setAutoSuggested(false);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="sandy-trigger fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-gold-bright)" }}>
            <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" />
          </svg>
          Frag Sandy
        </button>
      )}

      {open && (
        <div className="sandy-panel fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[80dvh] sm:w-[460px] sm:rounded-lg">
          <header
            className="flex items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(191, 163, 124, 0.12)", border: "1px solid var(--color-border-default)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-gold-bright)" }}>
                  <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Sandy</div>
                <div className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>AI-Assistentin · SalesAgent Hilfe</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                title="Neue Konversation"
                className="rounded-md p-1.5 transition-colors hover:bg-white/5"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v6h-6" />
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 transition-colors hover:bg-white/5"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`sandy-bubble max-w-[85%] rounded-md px-3.5 py-2.5 text-sm ${m.role === "user" ? "sandy-bubble--user" : "sandy-bubble--assistant"}`}>
                  {m.role === "assistant" ? (
                    <div className="sandy-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content || "…") }} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-secondary)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <button
              onClick={() => setEscalateOpen(true)}
              className="mb-3 w-full rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-secondary)" }}
            >
              Mit Support reden →
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 pb-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Frage stellen …"
                className="input"
                style={{ height: 44 }}
                disabled={streaming}
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="sandy-send flex h-11 w-11 items-center justify-center rounded-lg disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {escalateOpen && (
        <EscalationModal
          chatHistory={messages}
          onClose={() => setEscalateOpen(false)}
        />
      )}

      <style>{`
        /* Trigger-Button */
        .sandy-trigger {
          background: var(--color-bg-base);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border-strong);
          box-shadow:
            0 0 0 1px var(--color-border-subtle),
            0 18px 40px -10px rgba(0, 0, 0, 0.45),
            0 0 60px var(--gold-glow);
          cursor: pointer;
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 320ms ease;
        }
        .sandy-trigger:hover {
          transform: translateY(-1px);
          box-shadow:
            0 0 0 1px var(--color-border-subtle),
            0 22px 50px -10px rgba(0, 0, 0, 0.55),
            0 0 80px var(--gold-glow);
        }
        :root[data-theme="light"] .sandy-trigger {
          background: #FFFFFF;
          box-shadow:
            0 1px 0 rgba(26, 22, 18, 0.04),
            0 12px 32px -8px rgba(26, 22, 18, 0.20),
            0 0 50px var(--gold-glow);
        }

        /* Side-Panel */
        .sandy-panel {
          background: color-mix(in srgb, var(--color-bg-base) 92%, transparent);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid var(--color-border-default);
          box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.7);
        }
        :root[data-theme="light"] .sandy-panel {
          background: #FFFFFF;
          box-shadow: 0 20px 60px -12px rgba(26, 22, 18, 0.22);
        }

        /* Bubbles */
        .sandy-bubble--user {
          background: var(--color-gold-primary);
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }
        :root:not([data-theme="light"]) .sandy-bubble--user { color: #050505; }
        .sandy-bubble--assistant {
          background: color-mix(in srgb, var(--color-bg-elevated) 80%, transparent);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border-subtle);
          letter-spacing: -0.01em;
        }
        :root[data-theme="light"] .sandy-bubble--assistant {
          background: #F5F1E8;
          border-color: var(--color-border-subtle);
        }

        /* Send-Button */
        .sandy-send {
          background: var(--color-gold-primary);
          color: #FFFFFF;
        }
        :root:not([data-theme="light"]) .sandy-send { color: #050505; }
        .sandy-send:not(:disabled):hover { background: var(--color-gold-bright); }

        /* Markdown im Output */
        .sandy-md p { margin: 0.4rem 0; line-height: 1.55; }
        .sandy-md p:first-child { margin-top: 0; }
        .sandy-md p:last-child { margin-bottom: 0; }
        .sandy-md ul { padding-left: 1.1rem; margin: 0.4rem 0; }
        .sandy-md li { margin: 0.2rem 0; }
        .sandy-md code {
          font-family: var(--font-mono);
          background: rgba(191, 163, 124, 0.15);
          padding: 0.05rem 0.3rem;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .sandy-md a { color: var(--color-gold-light); text-decoration: underline; }
        .sandy-md strong { font-weight: 600; }

        /* Hover-State der Sub-Buttons abhängig vom Theme */
        :root[data-theme="light"] .hover\\:bg-white\\/5:hover {
          background-color: rgba(26, 22, 18, 0.04) !important;
        }
      `}</style>
    </>
  );
}

export function mountChatWidget(target: HTMLElement) {
  const root = createRoot(target);
  root.render(<ChatWidget />);
}

export default ChatWidget;
