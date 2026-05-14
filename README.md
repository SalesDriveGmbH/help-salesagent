# SalesAgent Hilfebereich

Öffentlicher Hilfebereich für SalesAgents unter `help.salesagent.at` — Apple/Linear-Style UI in Schwarz + Champagner-Gold, AI-Chat mit Claude Sonnet 4.6, Intercom-Eskalation und Admin-Bereich mit Live-Insights.

---

## Stack

| Komponente | Wahl |
|---|---|
| Framework | Astro 5 (`@astrojs/react`, `@astrojs/vercel`, server mode) |
| Hosting | Vercel |
| Styling | Tailwind 4 + Custom Design Tokens |
| Fonts | Geist + Geist Mono (lokal via @fontsource-variable) |
| Content | Astro Content Collections (Markdown) |
| Search | Custom JSON-Index + Command Palette |
| AI | Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| Ticketing | Intercom Conversations API v2.11 |
| Bot-Schutz | Cloudflare Turnstile (optional) |
| Storage | Vercel KV / Upstash Redis |
| Admin-Auth | Magic-Link via Resend |
| KB-Commits | GitHub API |

---

## Public Routes

| URL | Was |
|---|---|
| `/` | Startseite mit kinetischem Hero, Featured + Recent Articles |
| `/artikel/{kategorie}/{slug}` | Artikel mit Lesezeit, Lesefortschritt-Bar, Bookmarks, Share, "Als nächstes" |
| `/kategorie/{slug}` | Kategorie-Übersicht (abrechnung · technik · projekt · vertrag · ausbildung · community) |
| `/lesezeichen` | Gespeicherte Artikel (localStorage, privat) |
| `/glossar` | Alle Fachbegriffe mit Live-Filter |
| `/kontakt` | Email + Chat-CTA |
| `/{id}` | Short-Redirect: `/a01` → `/artikel/abrechnung/A01-...` |
| `/search-index.json` | JSON-Index für die Command Palette |
| 404 | Smart-404 mit Such-Vorschlägen und Top-Themen |

### Power-Features (Public)

- **⌘K Command Palette** — globale Suche + Quick-Actions (Theme switchen, Lesezeichen öffnen, Sandy fragen, …)
- **Sandy AI-Chat** — Claude Sonnet 4.6 mit RAG-Retrieval, Streaming, auto-Eskalation
- **Intercom-Eskalation** — Modal mit Anliegen-Feld, AI-Summary + automatisches Kategorie-Tagging
- **First-Visit Welcome-Card** — erscheint nach 1.2 s für neue Besucher
- **Onboarding-Tour** — 3-Step-Spotlight-Tour erklärt Sandy, ⌘K, Themen-Navigation
- **Theme-Picker** — System / Hell / Dunkel, persistiert in localStorage
- **Bookmarks** — Stern-Icon pro Artikel, localStorage, Standalone-Übersicht unter /lesezeichen
- **Lesefortschritt-Bar** + **Lesezeit** auf Artikeln
- **Scroll-Spy TOC** auf Desktop
- **Glossar-Tooltips** automatisch im Artikel-Body (HVV, PNV, CRM, …)
- **Recency-Dot** auf Cards für Artikel < 7 Tage alt
- **Rotierende Hero-Headlines** ("Frag Sandy" → "Find Antworten" → "Lerne schneller")
- **View Transitions API** für seidenweiche Seitenwechsel

---

## Admin Routes (`/admin/*`)

Magic-Link-gesichert, Allow-List über `ADMIN_ALLOWED_EMAILS`.

| URL | Was |
|---|---|
| `/admin/login` | Email eintragen → Magic-Link via Resend |
| `/admin` | Dashboard mit 4 Tabs (Add Knowledge · From Intercom · Pending Reviews · Library) |
| `/admin/insights` | Live-Insights mit 7-Tage-Sparklines + AI-Empfehlung |

### Power-Features (Admin)

- **Add Knowledge** — Notiz eintippen, Claude klassifiziert + schlägt Artikel oder Update vor
  - **KB-Lücken-Chips** zeigen die häufigsten Suchen ohne Treffer direkt zum Befüllen
- **From Intercom** — letzte 50 geschlossene Conversations, AI schlägt KB-Update vor
- **Library** — alle Artikel im Editor mit Live-Preview
  - **KB-Status-Heatmap** in der Sidebar (complete/partial/todo)
  - **"✨ Inhalt vorschlagen"** — Sandy generiert einen ersten Artikel-Inhalt aus Titel + Kategorie
  - **Frühere Versionen** aus Git-History (Rollback möglich)
- **Pending Reviews** — Drafts review + publish via GitHub-Commit → Vercel deployt in ~30 s
- **Insights** — 7-Tage-Sparklines, Top-10-Listen, AI-Empfehlung was als nächstes verbessert werden sollte

---

## Tracking (KV-basiert)

Events werden via `sendBeacon()` an `/api/track` geschickt:

- `search` / `search-no-result` — Command Palette
- `article-view` — Artikelseite
- `bookmark` — Stern aktivieren
- `chat-open` — Sandy öffnen
- `escalation` (Server-side) — erfolgreiche Intercom-Eskalation

90 Tage Retention für Daily-Counter. Top-N immer schnell dank Sorted Sets.

---

## Lokale Entwicklung

```bash
npm install
cp .env.example .env       # Keys eintragen
npm run dev
```

Lokaler Server: `http://localhost:4321`.

---

## Deployment

- Push auf `main` → Vercel deployt automatisch (~30 s).
- DNS: `CNAME help.salesagent.at → cname.vercel-dns.com`.
- Custom Cache-Headers via `vercel.json` (Bilder 30 d, Astro-Bundle 1 y, immutable).

---

## KB-Workflow

1. **Code-Update** → Push auf `main` → live in 30 s.
2. **Knowledge-Update** → via `/admin` → GitHub-API committet → Vercel re-deployed → live in 30 s.

Keine lokale Git-Bedienung nötig für KB-Pflege.

---

## Env-Variablen

Siehe `.env.example`. Wichtigste:

- `ANTHROPIC_API_KEY` — Claude API
- `INTERCOM_ACCESS_TOKEN` + `INTERCOM_ADMIN_ID` — Eskalation
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — Admin Magic-Link
- `GITHUB_TOKEN` + `GITHUB_REPO_OWNER` + `GITHUB_REPO_NAME` — KB-Commits
- `ADMIN_ALLOWED_EMAILS` — Komma-getrennte Allow-List für Admin
- `SESSION_SECRET` — Random (`openssl rand -base64 32`)
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` — automatisch von Vercel/Upstash injiziert
- `PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` — optional, Bot-Schutz

---

## Wartung

- Intercom Tag-IDs in `src/lib/intercom-tags.ts` halten (für korrektes Auto-Tagging)
- Glossar-Begriffe in `src/lib/glossary.ts` ergänzen (werden automatisch im Artikel-Body verlinkt)
- Kategorien in `src/lib/categories.ts` ändern

---

## Struktur

```
src/
├── content/articles/         # Markdown-Artikel (46 + wachsend)
├── components/
│   ├── public/                # Header, CommandPalette, ChatWidget, WelcomeCard, OnboardingTour, …
│   └── admin/                 # AdminDashboard, AddKnowledge, Library, ReviewCard, …
├── layouts/                   # Base / Article / Admin
├── pages/
│   ├── index.astro
│   ├── lesezeichen.astro
│   ├── glossar.astro
│   ├── kontakt.astro
│   ├── 404.astro
│   ├── [shortId].astro        # /a01-Redirects
│   ├── search-index.json.ts   # Build-Zeit-Index
│   ├── artikel/[...slug].astro
│   ├── kategorie/[category].astro
│   ├── admin/                 # login, verify, index, insights
│   └── api/                   # chat, escalate, track, admin/*
├── lib/                       # claude, intercom, knowledge, insights, glossary, auth, magic-link, github, …
├── middleware.ts              # /admin/* Auth-Check
└── styles/global.css          # Design Tokens + Komponenten-Styles
```
