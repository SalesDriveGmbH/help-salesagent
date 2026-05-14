# Changelog

## v1.0 — Production Polish (Nacht 14./15. Mai 2026)

Über 10 Iterationen wurde der SalesAgent-Hilfebereich von der minimalen Live-Version zu einem Apple/Linear-Grade-Produkt ausgebaut.

### Performance
- Geist + Geist Mono lokal hosted (`@fontsource-variable`)
- React-Bundle für Sandy-Chat lazy (`requestIdleCallback` + Klick)
- CommandPalette ebenfalls lazy
- Logo-Preload + fetchpriority + width/height
- Backdrop-Blur stark reduziert (GPU-Last)
- `vercel.json` Cache-Headers: Bilder 30 d, Astro-Bundle 1 y, immutable

### Search
- Pagefind ersetzt durch eigenen JSON-Index (`/search-index.json`)
- Command Palette (⌘K) mit Live-Fuzzy-Search, Spring-Animation
- Quick-Actions: Theme switchen, Lesezeichen öffnen, Glossar, Sandy, …
- „Did you mean?"-Vorschläge bei Levenshtein-Distanz ≤ 3
- Empty-State zeigt zuletzt gelesene + populäre Artikel

### Articles
- Lesezeit-Anzeige (Wörter ÷ 200 WPM)
- Lesefortschritt-Bar oben mit Gold-Glow
- Bookmark-Button (Stern-Icon, localStorage-persistiert)
- Share/Copy-Link mit Web-Share-API + Toast
- Scroll-Spy TOC mit aktivem Abschnitt + animierter Bar
- Glossar-Tooltips für HVV, PNV, CRM, SVS, UID, DSGVO, KPI etc.
- „Als nächstes"-Sektion mit 3 prioritären Artikeln derselben Kategorie
- Code-Blocks mit Copy-Button (Hover)
- Print-Stylesheet für sauberen Druck/PDF-Export
- Schema.org `TechArticle`-Structured-Data

### Public Pages
- Startseite mit kinetischer Headline („Frag Sandy" → „Find Antworten" → „Lerne schneller")
- Animierter Gold-Orb hinter dem Hero (14 s ease-in-out)
- „Frisch aktualisiert"-Banner mit den 3 zuletzt geänderten Artikeln
- Recency-Dot auf Cards für Artikel < 7 Tage alt
- `/lesezeichen` Standalone-Page mit Reading-Streak
- `/glossar` Standalone-Page mit Live-Filter
- Smart 404 mit Such-Vorschlägen + Top-Themen
- Short-ID-Redirects (`/a01` → Artikel)
- View Transitions API für seidenweiche Seitenwechsel

### First-Visit-Erlebnis
- Welcome-Card (erscheint 1.2 s nach Page-Load für neue Besucher)
- 3-Step-Onboarding-Tour mit Spotlight-Effekt
- „Tour erneut starten"-Link im Footer
- Smart Empty-State auf `/lesezeichen` mit empfohlenen Einstiegen

### Theming
- Theme-Picker mit 3 Modi (System / Hell / Dunkel)
- Live-Reagieren auf OS-Wechsel im System-Mode
- Pre-Paint-Script ohne FOUC
- Logo bekommt automatische Invert-Filter im Light-Mode
- Subtler Logo-Shimmer beim Page-Load

### Chat (Sandy)
- Floating-Button als pure HTML (sofort sichtbar, kein JS)
- Streaming-Antworten via SSE
- Auto-Eskalation nach 2–3 erfolglosen Turns
- Bei „Ja"/„Gerne" nach Auto-Suggestion: Eskalations-Modal öffnet automatisch
- Anliegen-Textarea im Eskalations-Modal
- Telefonnummer-Feld entfernt (war für Intercom problematisch)

### Admin Insights
- Live-Dashboard `/admin/insights` mit:
  - 5 Daily-Counter (Suchen, Views, Bookmarks, Chats, Eskalationen)
  - 7-Tage-Sparklines pro Counter (SVG, gradient-fill)
  - Top-10-Listen für jeden Metric
- AI-Empfehlung via Claude (30 min Cache, refresh-Button)
- Bot-Filter im Tracking (User-Agent-Regex)
- 90-Tage-Retention für Daily-Counter

### Admin Library
- KB-Status-Heatmap (complete/partial/todo) in der Sidebar
- „✨ Inhalt vorschlagen": Claude generiert ersten Artikel-Body
- Frühere Versionen aus Git-History abrufbar
- Direkt-Publish + Draft-Save mit Audit-Log

### Admin Add-Knowledge
- KB-Lücken-Chips: zeigt Top-10 Suchen ohne Treffer
- Klick füllt Notizfeld mit Prompt-Template
- × pro Chip entfernt aus dem Counter

### A11y + SEO
- Skip-to-Content-Link
- `:focus-visible` globale Gold-Outline
- Canonical Links + hreflang `de-AT`
- Open Graph + Twitter Cards + OG-Image (1200×630 SVG)
- theme-color für Dark + Light Mode

### Auth + Infrastruktur
- Magic-Link via Resend, Allow-List
- 7-Tage-Sessions in Vercel KV
- GitHub-API-Commits für KB-Updates → Vercel re-deploys in ~30 s
- Intercom Conversations API v2.11 mit Auto-Tagging
- Cloudflare Turnstile (optional)
- Rate-Limiting (KV-basiert) — zählt nur erfolgreiche Eskalationen
