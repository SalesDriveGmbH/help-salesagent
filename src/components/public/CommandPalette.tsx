import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

interface IndexItem {
  id: string;
  title: string;
  category: string;
  slug: string;
  url: string;
  tldr: string;
  keywords: string[];
  status: string;
  priority: number;
  body: string;
}

interface QuickAction {
  id: string;
  title: string;
  hint: string;
  keywords: string[];
  run: () => void;
}

function buildQuickActions(): QuickAction[] {
  return [
    {
      id: "act:chat",
      title: "Sandy fragen",
      hint: "Chat öffnen",
      keywords: ["chat", "sandy", "frage", "ai", "ki", "support"],
      run: () => window.dispatchEvent(new CustomEvent("sandy:open")),
    },
    {
      id: "act:bookmarks",
      title: "Lesezeichen öffnen",
      hint: "Deine gemerkten Artikel",
      keywords: ["lesezeichen", "bookmarks", "gemerkt", "merken", "saved"],
      run: () => window.location.assign("/lesezeichen"),
    },
    {
      id: "act:glossar",
      title: "Glossar öffnen",
      hint: "HVV, PNV, CRM etc.",
      keywords: ["glossar", "begriffe", "definition", "abkürzung", "hvv", "pnv"],
      run: () => window.location.assign("/glossar"),
    },
    {
      id: "act:kontakt",
      title: "Kontakt",
      hint: "Email + Telefon",
      keywords: ["kontakt", "email", "office"],
      run: () => window.location.assign("/kontakt"),
    },
    {
      id: "act:home",
      title: "Zur Startseite",
      hint: "Hilfe & Antworten",
      keywords: ["home", "start", "startseite"],
      run: () => window.location.assign("/"),
    },
    {
      id: "act:theme-light",
      title: "Theme: Hell",
      hint: "Light-Mode aktivieren",
      keywords: ["hell", "light", "theme", "tag", "weiß"],
      run: () => {
        try { localStorage.setItem("sd-theme-mode", "light"); } catch {}
        document.documentElement.setAttribute("data-theme", "light");
      },
    },
    {
      id: "act:theme-dark",
      title: "Theme: Dunkel",
      hint: "Dark-Mode aktivieren",
      keywords: ["dunkel", "dark", "theme", "nacht", "schwarz"],
      run: () => {
        try { localStorage.setItem("sd-theme-mode", "dark"); } catch {}
        document.documentElement.setAttribute("data-theme", "dark");
      },
    },
    {
      id: "act:theme-system",
      title: "Theme: System",
      hint: "OS-Setting folgen",
      keywords: ["system", "auto", "theme"],
      run: () => {
        try { localStorage.setItem("sd-theme-mode", "system"); } catch {}
        const light = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
        document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
      },
    },
  ];
}

function scoreAction(a: QuickAction, q: string): number {
  if (!q) return 0;
  const nq = q.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const t = a.title.toLowerCase();
  let s = 0;
  if (t.includes(nq)) s += 80;
  if (t.startsWith(nq)) s += 40;
  for (const k of a.keywords) {
    if (k.includes(nq)) s += 30;
    if (k.startsWith(nq)) s += 20;
  }
  return s;
}

const CATEGORY_LABEL: Record<string, string> = {
  abrechnung: "Abrechnung",
  technik: "Technik",
  projekt: "Projekte",
  vertrag: "Vertrag",
  ausbildung: "Ausbildung",
  community: "Community",
};

const RECENT_KEY = "sd:recent-articles";
const MAX_RECENT = 5;

function normalize(s: string) {
  return s.toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss");
}

function score(item: IndexItem, query: string): number {
  if (!query) return 0;
  const q = normalize(query);
  const title = normalize(item.title);
  const tldr = normalize(item.tldr);
  const id = normalize(item.id);
  const kws = item.keywords.map(normalize).join(" ");
  const body = normalize(item.body);

  let s = 0;
  if (title.includes(q)) s += 100;
  if (title.startsWith(q)) s += 60;
  if (id === q) s += 200;
  if (kws.includes(q)) s += 40;
  if (tldr.includes(q)) s += 25;
  if (body.includes(q)) s += 10;

  // Pro Wort des Query: subscore
  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  for (const w of words) {
    if (title.includes(w)) s += 30;
    if (kws.includes(w)) s += 12;
    if (tldr.includes(w)) s += 8;
    if (body.includes(w)) s += 3;
  }
  return s;
}

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch { return []; }
}

function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<IndexItem[] | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Index lazy laden
  useEffect(() => {
    if (!open || index) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  }, [open, index]);

  // ⌘K / Strg+K Listener + open-Event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() { setOpen(true); }
    function onOpenWithQuery(e: Event) {
      const q = (e as CustomEvent).detail?.query ?? "";
      setOpen(true);
      setTimeout(() => { setQuery(q); inputRef.current?.focus(); }, 50);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", onOpen);
    window.addEventListener("palette:open-with-query", onOpenWithQuery);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("palette:open", onOpen);
      window.removeEventListener("palette:open-with-query", onOpenWithQuery);
    };
  }, []);

  // Focus auf Input wenn geöffnet
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setRecent(loadRecent());
      setQuery("");
      setHighlight(0);
    }
  }, [open]);

  // Body-Scroll-Lock
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const actions = useMemo(() => buildQuickActions(), []);

  type Row = { kind: "article"; item: IndexItem; section: string }
            | { kind: "action"; action: QuickAction; section: string };

  const results: Row[] = useMemo(() => {
    if (!index) return [];
    if (!query.trim()) {
      const recents = recent
        .map((id) => index.find((i) => i.id === id))
        .filter(Boolean) as IndexItem[];
      const top = [...index]
        .filter((i) => i.priority <= 21 && !recent.includes(i.id))
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 6);
      const featuredActions = actions.slice(0, 3);
      return [
        ...recents.map((i) => ({ kind: "article" as const, item: i, section: "Zuletzt gelesen" })),
        ...top.map((i) => ({ kind: "article" as const, item: i, section: "Häufig gesucht" })),
        ...featuredActions.map((a) => ({ kind: "action" as const, action: a, section: "Aktionen" })),
      ];
    }
    const articleScored = index.map((i) => ({ item: i, _score: score(i, query) }))
      .filter((x) => x._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 8);
    const actionScored = actions.map((a) => ({ action: a, _score: scoreAction(a, query) }))
      .filter((x) => x._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 4);
    return [
      ...articleScored.map((s) => ({ kind: "article" as const, item: s.item, section: "Treffer" })),
      ...actionScored.map((s) => ({ kind: "action" as const, action: s.action, section: "Aktionen" })),
    ];
  }, [index, query, recent, actions]);

  function activate(row: Row) {
    if (row.kind === "action") {
      setOpen(false);
      setTimeout(() => row.action.run(), 80);
      return;
    }
    const item = row.item;
    try {
      const next = [item.id, ...loadRecent().filter((id) => id !== item.id)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
    if (query.trim()) {
      navigator.sendBeacon?.("/api/track", JSON.stringify({ event: "search", value: query.trim() }));
    }
    window.location.assign(item.url);
  }

  // Track "no result"-Suchen mit Debounce
  useEffect(() => {
    if (!query.trim() || results.length > 0 || !index) return;
    const t = setTimeout(() => {
      navigator.sendBeacon?.("/api/track", JSON.stringify({ event: "search-no-result", value: query.trim() }));
    }, 1200);
    return () => clearTimeout(t);
  }, [query, results.length, index]);

  function onKeyDown(e: React.KeyboardEvent) {
    const max = results.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(max, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = results[highlight];
      if (sel) activate(sel);
    }
  }

  useEffect(() => { setHighlight(0); }, [query]);

  if (!open) return null;

  let lastSection = "";
  return (
    <div className="cp-backdrop fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="cp-panel w-full max-w-xl overflow-hidden rounded-lg">
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-tertiary)" }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Suchen — Artikel, Themen, IDs …"
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: "var(--color-text-primary)" }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border px-1.5 py-0.5 text-[11px]" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-tertiary)" }}>esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {index === null
                ? "Lade Index …"
                : query.trim()
                ? <>Keine Treffer für „{query}". <button className="ml-1 underline" onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent("sandy:open")); }}>Sandy fragen</button></>
                : "Tipp etwas — oder schau die häufigsten Themen unten."}
            </div>
          )}
          {results.map((row, idx) => {
            const showSection = row.section !== lastSection;
            lastSection = row.section;
            const active = idx === highlight;
            const key = row.kind === "article" ? row.item.id : row.action.id;
            return (
              <div key={key}>
                {showSection && (
                  <div className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>
                    {row.section}
                  </div>
                )}
                <button
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => activate(row)}
                  className={`group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${active ? "cp-row-active" : ""}`}
                >
                  {row.kind === "article" ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                          <span className="font-mono">{row.item.id}</span>
                          <span>·</span>
                          <span>{CATEGORY_LABEL[row.item.category]}</span>
                        </div>
                        <div className="mt-0.5 truncate text-sm font-medium" style={{ color: active ? "var(--color-gold-bright)" : "var(--color-text-primary)" }}>
                          {row.item.title}
                        </div>
                        {row.item.tldr && (
                          <div className="mt-0.5 truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {row.item.tldr}
                          </div>
                        )}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: active ? "var(--color-gold-bright)" : "var(--color-text-quaternary)" }}>
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="cp-action-icon" aria-hidden="true">⌘</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: active ? "var(--color-gold-bright)" : "var(--color-text-primary)" }}>
                          {row.action.title}
                        </div>
                        <div className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {row.action.hint}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: active ? "var(--color-gold-bright)" : "var(--color-text-quaternary)" }}>
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3 text-[11px]" style={{ borderTop: "1px solid var(--color-border-subtle)", color: "var(--color-text-tertiary)" }}>
          <div className="flex items-center gap-3">
            <span><kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--color-border-default)" }}>↑↓</kbd> navigieren</span>
            <span><kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--color-border-default)" }}>↵</kbd> öffnen</span>
          </div>
          <button onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent("sandy:open")); }} className="underline transition-colors hover:text-[var(--color-gold-bright)]">
            Stattdessen Sandy fragen
          </button>
        </div>
      </div>

      <style>{`
        .cp-backdrop { background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: cp-fade 180ms ease both; }
        :root[data-theme="light"] .cp-backdrop { background: rgba(26,22,18,0.35); }
        .cp-panel {
          background: color-mix(in srgb, var(--color-bg-elevated) 96%, transparent);
          border: 1px solid var(--color-border-default);
          box-shadow: 0 24px 80px -10px rgba(0,0,0,0.6), 0 0 0 1px var(--color-border-subtle);
          animation: cp-pop 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        :root[data-theme="light"] .cp-panel {
          background: #FFFFFF;
          box-shadow: 0 28px 80px -12px rgba(26,22,18,0.30);
        }
        .cp-row-active { background: color-mix(in srgb, var(--color-gold-primary) 10%, transparent); }
        .cp-action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--color-border-subtle);
          color: var(--color-gold-bright);
          font-family: var(--font-mono);
          font-size: 0.85rem;
        }
        @keyframes cp-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cp-pop { from { opacity: 0; transform: translateY(-8px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}

export function mountCommandPalette(target: HTMLElement) {
  const root = createRoot(target);
  root.render(<CommandPalette />);
}

export default CommandPalette;
