# SalesAgent Hilfebereich

Öffentlicher Hilfebereich für die SalesAgents der SalesDrive GmbH unter `help.salesagent.at` — gebaut mit Astro 5, Tailwind 4, Claude Sonnet 4.6 (RAG-Chat), Intercom-Eskalation und einem Magic-Link-gesicherten Admin-Bereich zur dynamischen KB-Pflege.

---

## Stack

| Komponente | Wahl |
|---|---|
| Framework | Astro 5 (`@astrojs/react`, `@astrojs/vercel`, server mode) |
| Hosting | Vercel |
| Styling | Tailwind 4 |
| Content | Astro Content Collections (`.md`) |
| Search | Pagefind |
| AI | Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| Ticket | Intercom Conversations API v2.11 |
| Bot-Schutz | Cloudflare Turnstile |
| Rate-Limit / Storage | Vercel KV |
| Admin-Auth | Magic-Link via Resend |
| KB-Commits | GitHub API |

---

## Schneller Start (lokal)

```bash
npm install
cp .env.example .env       # alle Keys eintragen
npm run dev
```

Lokaler Dev-Server: `http://localhost:4321`.

---

## Deployment

- Push auf `main` → Vercel deployt automatisch (~30 Sekunden).
- DNS: `CNAME help.salesagent.at → cname.vercel-dns.com`.

---

## Workflow für KB-Updates

1. **Code-Update** → Push auf `main` → live in 30 s.
2. **Knowledge-Update** → über `/admin` UI → KB-Eintrag wird per GitHub-API committet → Vercel re-deployed → live in 30 s.

Keine lokale Git-Bedienung nötig für KB-Pflege.

---

## Vor Go-Live noch tun

- [ ] Anthropic API-Key generieren → `ANTHROPIC_API_KEY` in Vercel Env-Vars
- [ ] Intercom Access Token + Admin-ID einrichten → Env-Vars
- [ ] Intercom Tag-IDs in `src/lib/intercom-tags.ts` eintragen (für die 7 Kategorie-Tags)
- [ ] Cloudflare Turnstile Site-/Secret-Key generieren → Env-Vars
- [ ] Resend-Account, Domain `help.salesagent.at` verifizieren (SPF + DKIM), API-Key generieren → Env-Vars
- [ ] GitHub PAT mit Scope `repo` generieren → `GITHUB_TOKEN` Env-Var
- [ ] Allow-Liste `ADMIN_ALLOWED_EMAILS` setzen (komma-getrennt, ohne Leerzeichen)
- [ ] `SESSION_SECRET=$(openssl rand -base64 32)` setzen
- [ ] DNS umstellen
- [ ] 18 TODO-Stellen in `knowledge-base.md` füllen (entweder im Repo oder via `/admin`)

---

## Resend-Setup (Magic-Link Versand)

1. Account auf [resend.com](https://resend.com) anlegen.
2. Domain `help.salesagent.at` verifizieren.
3. Zwei DNS-Records (SPF + DKIM) hinterlegen, Resend zeigt die exakten Werte an.
4. API-Key generieren → `RESEND_API_KEY` in Vercel.
5. Test-Mail aus dem Resend-Dashboard verschicken, um die Verifikation zu bestätigen.

---

## Struktur

```
src/
├── content/articles/     # Astro Content Collections (Markdown)
├── components/public/    # Header, ArticleCard, ChatWidget …
├── components/admin/     # AdminHeader, AddKnowledge, Library …
├── layouts/              # Base / Article / Admin
├── pages/                # Public + /admin + /api
├── lib/                  # claude, intercom, knowledge, rate-limit, github, auth, …
├── middleware.ts         # /admin/* → Auth-Check
└── styles/global.css
```
