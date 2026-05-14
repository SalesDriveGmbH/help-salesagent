# SalesAgent Hilfebereich — Wissensdatenbank v2.0 (FINAL)

> **Quellen:** 72 Support-Tickets (Trello), Handelsvertretervertrag (HVV) v2026, Plattform-Nutzungsvertrag (PNV) v2026 + AGB, direkte Antworten von Lukas Kiraly.
> **Stand:** 14. Mai 2026
> **Verwendung:** Single Source of Truth für den Claude-Haiku-Chatbot (RAG) und für die statisch generierten Artikel-Seiten.

---

## Wichtige Kontakt-Adressen

| Zweck | Adresse |
|---|---|
| Abrechnungs-Einwände (Frist: 5 Werktage) | `accounting@salesdrive.at` |
| Allgemeine Geschäfts-Email | `office@salesdrive.at` |
| Telefon | `+43 (0) 676 7951018` |
| Geschäftsführer | Alexander Kiraly |

## Geschäftszeiten

Mo–Fr 09:00–17:00 CET. Reaktionszeit Support: max. 24h an Werktagen.

---

## Glossar

| Begriff | Definition |
|---|---|
| **Wählversuch** | Jeder im CRM dokumentierte ausgehende Anrufversuch (Status: erreicht / nicht erreicht / aufgelegt / Mailbox / ungültige Nummer). HVV §1 |
| **Analysegespräch** | Telefonisches Gespräch mit Entscheidungsträger, mind. 20 Min., projektspezifische Qualifizierungskriterien durchgearbeitet, vollständig im CRM dokumentiert. HVV §1 |
| **Einkünfte / Einkommen** | Identisch. Bruttobetrag aller Vergütungen seit Vertragsbeginn. |
| **GewUmsätze** | Gewerbliche Umsätze (relevant für eigene Steuererklärung). |
| **Kontostand** | Aktuelles Guthaben auf dem internen SalesDrive-Konto, das auf Auszahlung wartet. |
| **Abzüge SA Ausbildung** | Bereits verrechneter Anteil der Sales-Agent-Ausbildungspauschale (3.500 € netto). |
| **Abzüge SM Ausbildung** | Sales-Manager-Ausbildungspauschale, dieselbe Logik. |
| **Auszahlung** | Der Betrag, der diesen Monat aufs Bankkonto überwiesen wird. |
| **Abwicklungsgebühr** | 7,5% pauschal vom Brutto — deckt Plattform, Infrastruktur, Administration. HVV §4.6 |
| **Rückhaltequote** | Anteil, der vom Salesmanager einbehalten wird. [TODO Lukas] |
| **Empfehlungsprovision** | Provision für geworbene Sales Agents. [TODO Lukas: Höhe, Laufzeit] |
| **Konversionsrate (1:100)** | Pro 100 Wählversuche min. 1 qualifiziertes Analysegespräch. HVV §5 |
| **Hold-Mechanismus** | Bei Unterschreitung der Konversion: überzählige Wählversuche werden nicht oder erst im Folgemonat vergütet. PNV §3 |
| **Tracking-Dashboard** | Auswertungsoberfläche im CRM zur Echtzeit-Einsicht. |
| **Freigabe** | Schriftliche Bestätigung der erfolgreich abgeschlossenen Ausbildung — Voraussetzung für Projektzuteilung. |
| **Kapazitätenplanung** | Verbindlich gemeldete Wochenstunden Mo–Fr 08–12 / 13–18. HVV §6 |
| **HVV** | Handelsvertretervertrag — regelt die laufende Tätigkeit. |
| **PNV** | Plattform-Nutzungsvertrag — regelt Ausbildung, Lizenzgebühr 3.500 €, Plattform-Zugang. |
| **PandaDoc** | E-Signatur-Plattform für HVV und PNV. |
| **Triangility** | [TODO Lukas] |
| **Bitberry** | [TODO Lukas — Rechnungs-Provider?] |
| **Analysegespräche AI** | Internes Tool zur Transkript-Auswertung. [TODO Lukas] |

---

## Tool-Landschaft

1. **app.salesdrive.at** — Dashboard: Abrechnung, Verträge, Tracking, Auszahlungsübersicht
2. **Memberspot** — Schulungen, Skripte, Trainings-Aufzeichnungen
3. **Close.com** — CRM
4. **Calendly** — Terminbuchung Analyse-Calls
5. **Triangility** — [TODO]
6. **Analysegespräche AI** — Transkript-Auswertung (intern)
7. **PandaDoc** — E-Signatur
8. **WhatsApp** — Support-Kanal (12h Reaktionszeit, PNV §1.2)

---

# KATEGORIE 1 — Abrechnung & Auszahlung

## A01 — Wann werde ich ausbezahlt?

**TL;DR:** Am **1. jedes Monats** für den Vormonat. Fällt der 1. auf einen **Samstag oder Sonntag**, wird am nächsten Werktag überwiesen. Mindestbetrag: **50 €**.

**Voraussetzungen** (alle drei müssen erfüllt sein):
1. Handelsvertretervertrag unterschrieben
2. Gewerbeanmeldung eingereicht
3. Steuernummer (oder Beantragungsnachweis) übermittelt

Vertraglich zusätzlich (HVV §4.7):
- Gültiges Auszahlungskonto (IBAN + Kontoinhaber)
- Steuerliche Eigenerklärung unterzeichnet
- Erfolgreiche Freigabe durch das Projekt

Liegt einer dieser Punkte nicht vor, wird der Betrag im internen Konto vorgemerkt und mit der nächsten möglichen Auszahlung übertragen.

> **Hinweis zur Vertragsfrist:** Der HVV §4.5 nennt als spätesten Termin den 10. Werktag des Folgemonats. In der Praxis zahlen wir bereits am 1. aus (bzw. nächster Werktag bei Wochenende) — also schneller als vertraglich geschuldet.

---

## A02 — Wann ist der Einsendeschluss meiner Aktivitäten?

**TL;DR:** **Monatsletzter, 18:00 Uhr.** Bis dahin müssen alle Wählversuche und Analysegespräche im CRM dokumentiert sein.

**Operativer Ablauf:**

| Zeitpunkt | Was passiert |
|---|---|
| Monatsletzter, **18:00 Uhr** | Einsendeschluss — danach werden keine Aktivitäten mehr für den Vormonat gezählt |
| Monatsletzter, **18:01–22:00 Uhr** | Automatische Auswertung und Aufbereitung deiner Abrechnung |
| Folgetag (= 1. des Monats), **bis 12:00 Uhr** | Abrechnung ist in deinem Dashboard online sichtbar |
| Folgetag (= 1. des Monats) | Auszahlung erfolgt (bei Sa/So → nächster Werktag) |

**Was zählt als rechtzeitig dokumentiert:**
- Alle Wählversuche im CRM (Close)
- Alle Analysegespräche mit vollständiger Dokumentation, mind. 20 Min.
- Falls projektabhängig: Call-Recording verfügbar

**Wichtig:** Nicht oder unvollständig dokumentierte Aktivitäten begründen **keinen Vergütungsanspruch** — auch wenn sie tatsächlich stattgefunden haben. HVV §4.2

> **Hinweis zur Vertragsfrist:** Der HVV §4.5 nennt formell den 5. Werktag des Folgemonats als Einsendeschluss. Die operative Praxis ist strenger (Monatsletzter 18:00) — dafür bekommst du deine Auszahlung schneller. Bei Härtefällen: kurz an `accounting@salesdrive.at`.

---

## A03 — Wie berechnet sich meine Vergütung?

**Vergütungssätze** (netto, HVV §4.1):
- **1,50 €** pro Wählversuch
- **25,00 €** pro qualifiziertem Analysegespräch (mind. 20 Min.)

**Davon werden abgezogen:**
- **7,5 % Abwicklungsgebühr** (HVV §4.6)
- Anteilige Ausbildungskosten (falls noch nicht beglichen)
- Eventuell Rückhaltequote

**Beispielrechnung — Standard-Monat (500 Wählversuche + 5 Analysegespräche):**

| Position | Betrag |
|---|---|
| 500 × 1,50 € | 750,00 € |
| 5 × 25,00 € | 125,00 € |
| **Brutto-Vergütung** | **875,00 €** |
| − 7,5 % Abwicklungsgebühr | − 65,63 € |
| **Netto vor Abzügen** | **809,37 €** |
| − Ausbildungs-Rate (individuell) | [variabel] |
| − Rückhaltequote (individuell) | [variabel] |
| **Auszahlung** | **= Endbetrag** |

**Maximalmengen pro Kalendermonat** (PNV §3):
- Max. 1.000 Wählversuche
- Max. 10 qualifizierte Analysegespräche
- Mehrleistungen werden nicht vergütet

---

## A04 — Konversionsgarantie 1:100

Pro 100 Wählversuche muss mind. **1 qualifiziertes Analysegespräch** zustande kommen.

**Formel:** Analysegespräche ÷ Wählversuche × 100 = Konversionsrate in %.

| Szenario | Folge |
|---|---|
| 1 Monat unter 1:100 | Hold-Mechanismus: überzählige Wählversuche werden ggf. erst im Folgemonat oder nicht vergütet (PNV §3) |
| 2 Folgemonate unter 1:100 | Projektabzug, kostenpflichtige Nachschulung, oder außerordentliche Kündigung möglich (HVV §5.3) |

**Beweislast:** CRM-Daten sind verbindlicher Nachweis (HVV §5.5).

---

## A05 — Mein Kontoblatt verstehen

Bezug zum echten Ticket: "Was bedeuten die Zahlen: Einkünfte 15.562, Einkommen 13.255, GewUmsätze 6.912,99, Kontostand 5162,99, Abzüge SA Ausbildung 3.500, SM Ausbildung 6.906, Auszahlung 5629"

| Spalte | Bedeutung |
|---|---|
| **Einkünfte / Einkommen** | Bruttobetrag aller Vergütungen seit Vertragsbeginn. Beides bezeichnet dasselbe. |
| **GewUmsätze** | Gewerbliche Umsätze — für deine Steuererklärung relevant. |
| **Kontostand** | Aktuelles Guthaben auf dem SalesDrive-internen Konto. |
| **Abzüge SA Ausbildung** | Bereits verrechneter Anteil deiner 3.500 € Sales-Agent-Ausbildung. |
| **Abzüge SM Ausbildung** | Sales-Manager-Ausbildungspauschale (falls anwendbar). |
| **Auszahlung** | Was diesen Monat tatsächlich aufs Bankkonto überwiesen wird. |

Du findest dein Kontoblatt im Dashboard unter `app.salesdrive.at` → "Meine Abrechnung".

---

## A06 — Fehlende Wählversuche / Analysegespräche melden

**TL;DR:** Frist **5 Werktage** nach Zustellung der Abrechnung. Schriftlich an **accounting@salesdrive.at**.

**So gehst du vor:**

1. **Tracking-Dashboard prüfen** in `app.salesdrive.at` → mit Close-Aktivitäten vergleichen
2. **Mail an `accounting@salesdrive.at`** mit:
   - Dein Name
   - Betroffener Monat
   - Fehlende Wählversuche: Datum, Uhrzeit, Lead-Name (Liste)
   - Fehlende Analysegespräche: Datum, Lead-Name, Dauer
   - Wenn möglich: Close-Screenshot
3. **Frist beachten**: 5 Werktage nach Zustellung (HVV §4.8). Danach gilt die Abrechnung als genehmigt.

**Häufige Gründe für "fehlende" Aktivitäten:**
- Wählversuch nicht im CRM dokumentiert
- Analysegespräch unter 20 Minuten → zählt nicht als qualifiziert
- Aktivität unter falschem Account dokumentiert
- Überschreitung der Maximalmengen (1.000 / 10 pro Monat)

---

## A07 — Was zählt als abrechenbarer Wählversuch?

Jeder ausgehende Anrufversuch an einen Kontakt aus der bereitgestellten Liste, **wenn im CRM dokumentiert**, mit Status:
- erreicht
- nicht erreicht
- aufgelegt
- Mailbox
- ungültige Nummer

**Nicht abrechenbar:**
- Anrufe ohne CRM-Eintrag
- Tests / Demo-Anrufe
- [TODO: Wiederholte Anrufe an dieselbe Nummer am selben Tag — gelten die als separate Wählversuche?]

---

## A08 — Was zählt als qualifiziertes Analysegespräch?

Alle Kriterien (HVV §1) müssen erfüllt sein:
- mit Entscheidungsträger oder qualifiziertem Ansprechpartner
- **Mindestdauer 20 Minuten**
- projektspezifische Qualifizierungskriterien systematisch durchgearbeitet
- **vollständig im CRM dokumentiert**
- sofern vorgesehen: Call-Recording auswertbar

**Qualitätsvorbehalt:** SalesDrive kann ein Gespräch nachträglich als nicht qualifiziert einstufen wenn:
- Dauer < 20 Min.
- Dokumentation fehlt oder unvollständig
- Ansprechperson kein Entscheider

---

## A09 — Mindestauszahlung 50 €

Liegt deine Auszahlung **unter 50 €**, wird der Betrag auf den Folgemonat übertragen.

---

## A10 — Empfehlungsprovision

[TODO Lukas — bitte präzisieren:
- Höhe (% oder Festbetrag)?
- Laufzeit nach Empfehlung?
- Monatlich oder einmalig?
- Was passiert bei Kündigung des Empfohlenen?]

---

## A11 — Rückhaltequote (Salesmanager-Rückhalt)

[TODO Lukas — Standard-Höhe? Wann aktiv? Auf Antrag bei wem reduzierbar?]

---

## A12 — Ausbildungskosten verrechnen

**TL;DR:** 3.500 € Lizenzgebühr (PNV §2) wird automatisch von der laufenden Vergütung abgezogen — kein separater Antrag.

**Mechanik:**
- 50 % bei Start als Anzahlung
- 50 % auf 5 monatliche Raten

Erscheint auf dem Kontoblatt als **"Abzüge SA Ausbildung"**.

**Erfolgsbonus** (PNV-AGB §5): Bei kumuliertem Netto-Umsatz von **30.000 €** bekommst du einen einmaligen Bonus von **3.500 €** (entspricht der Lizenzgebühr). Voraussetzung: Vertrag ungekündigt + alle Pflichten erfüllt.

---

# KATEGORIE 2 — CRM & Tools

## T01 — Close: Email-Konto verbinden

[TODO Lukas — Schritt-für-Schritt:
- Welcher Email-Provider empfohlen?
- SMTP/IMAP-Daten?
- Bei Gmail: App-Password-Anleitung?
- Projekt-spezifische Email-Adressen (z.B. Digilight)?
- Wer hilft bei Verbindungsproblemen?]

---

## T02 — Calendly: eigener vs. shared Link

[TODO Lukas — Klärung:
- Bekommt jeder Agent einen eigenen Calendly-Link?
- Wann gemeinsamer Link?
- Wer richtet eigenen Link ein?]

---

## T03 — Analysegespräche AI: "API-Schlüssel ungültig"

[TODO Lukas:
- Eigenentwicklung oder externes Tool?
- Wo finden Agents den API-Schlüssel?
- Was tun bei "ungültig"-Fehler?]

---

## T04 — Analysegespräche AI: 10.000-Zeichen-Limit

**Workaround:**
- Intro und Outro aus dem Transkript entfernen
- Begrüßung, Smalltalk, Verabschiedung kürzen
- Fokus auf qualifizierungsrelevante Passagen

[TODO Lukas: Wird das Limit erhöht? Alternative für längere Transkripte?]

---

## T05 — Triangility

[TODO Lukas — was ist Triangility (Projekt? Tool? Plattform)? Wer trägt einen Agent dort ein? Was tun bei fehlenden Leads?]

---

## T06 — Close: Custom Fields anpassen

[TODO Lukas — können Agents selbst anlegen oder beantragen? Bei wem?]

---

## T07 — Dashboard-Reiter fehlen

**Typische Ursachen:**
- HVV noch nicht unterschrieben → Abrechnungs-Reiter erst nach vollständiger Signatur freigeschaltet
- Onboarding-Schritte (HVV §20) nicht vollständig
- Erste Aktivität fehlt → Kontoblatt erscheint erst nach erstem Aktivitäts-Monat

**Was tun:**
1. Im Dashboard prüfen, welche Onboarding-Schritte noch offen sind
2. Wenn alle erledigt: Support anschreiben

---

# KATEGORIE 3 — Projekt-Onboarding

## P01 — Projekt-Start: Onboarding-Prozess

**TL;DR:** Nach erfolgreicher Freigabe bekommst du innerhalb von **4 Wochen** ein Projekt angeboten (PNV §4).

**Verbindlicher Prozess** (HVV §20):

1. Digitale Unterzeichnung HVV (PandaDoc)
2. Stammdaten im Onboarding-Formular
3. Verbindliche Kapazitätenplanung (Mo–Fr, 08–12 / 13–18)
4. Auszahlungskonto (IBAN + Kontoinhaber)
5. Business-Portrait hochladen
6. Steuerliche Eigenerklärung unterzeichnen
7. Gewerbenachweis (oder Beantragungsbestätigung)

Erst nach **vollständigem Abschluss** kann eine Projektzuteilung erfolgen.

---

## P02 — Projekt-Zugangsdaten finden

[TODO Lukas:
- Wo liegen Zugangsdaten pro Projekt?
- Wer ist verantwortlich bei Fehlen?
- Welcher Ordner / welche Plattform?]

---

## P03 — Kapazität ändern

(HVV §6) Änderungen **mind. 7 Werktage im Voraus schriftlich** mitteilen.

**An wen?** [TODO Lukas — Email-Adresse]

**Wichtig:** Bei Unterschreitung der Mindestaktivität um >30 % in zwei Folgewochen ohne Vorankündigung kann gekündigt werden.

---

## P04 — Mehrere Projekte gleichzeitig

[TODO Lukas]

---

## P05 — Projekt-Pipeline

[TODO Lukas — wie kommuniziert ihr aktuelle Projekte? Slack? Email?]

---

# KATEGORIE 4 — Vertrag & Steuer

## V01 — HVV-Überblick

Der HVV wird über **PandaDoc** elektronisch unterzeichnet.

**Eckpunkte:**

| Thema | Wert |
|---|---|
| Vergütung Wählversuch | 1,50 € netto |
| Vergütung Analysegespräch | 25,00 € netto |
| Abwicklungsgebühr | 7,5 % |
| Konversionsgarantie | 1:100 |
| Max. Wählversuche / Monat | 1.000 |
| Max. Analysegespräche / Monat | 10 |
| Kündigungsfrist | 1 Monat zum Monatsende |
| Wettbewerbsverbot nach Vertragsende | 12 Monate |
| Einwendungsfrist Abrechnung | 5 Werktage |
| Gerichtsstand | Wien |
| Anwendbares Recht | Österreichisch |

**Wo findest du deinen unterschriebenen HVV?** [TODO Lukas]

---

## V02 — Unterlagen einsenden

[TODO Lukas:
- Wo ist das Onboarding-Formular (URL)?
- Foto-Format / Auflösung?
- Wenn Formular nicht funktioniert: an wen?]

---

## V03 — Gewerbeanmeldung & Steuernummer

Du bist selbstständiger Unternehmer (HVV §2). Du musst eigenständig:
- Gewerbe anmelden
- Beim Finanzamt registrieren
- Bei Sozialversicherung anmelden (Österreich: SVS)
- Alle Steuern selbst abführen

**Sonderfall Gründer** (PNV §1.4): 30 Tage Frist für Nachweis nach Vertragsschluss. Bis dahin ruht die Projektzuweisung.

[TODO Lukas: an welche Adresse die Gewerbeanmeldung / Steuernummer einreichen?]

---

## V04 — Reverse Charge Verfahren (DE → AT)

[TODO Lukas — bitte mit Steuerberater abstimmen, Vorschlag:

SalesDrive GmbH ist österreichisch (UID **ATU79430518**). Deutsche Sales Agents fakturieren im Reverse-Charge-Verfahren:

Auf der Rechnung muss stehen:
- Deine Steuer-/Umsatzsteuernummer
- UID SalesDrive: ATU79430518
- Vermerk: "Steuerschuldnerschaft des Leistungsempfängers — Reverse Charge"
- **Kein** deutscher USt-Ausweis

→ Bitte vom Steuerberater bestätigen lassen. Disclaimer: "Halte mit deinem Steuerberater Rücksprache."]

---

## V05 — Bestätigungsschreiben für Behörden

[TODO Lukas — wer stellt aus? Office@?]

---

## V06 — Kündigung

(HVV §16) **1 Monat zum Monatsende.** Schriftform (Email reicht).

**An wen?** [TODO Lukas]

**Folgen einer Kündigung:**
- Laufende Projekte sauber übergeben
- CRM- und Tool-Zugänge werden gelöscht
- Alle Materialien zurückgeben / digital löschen
- **Wettbewerbsverbot 12 Monate** nach Vertragsende (HVV §12)
- Ggf. Ausgleichsanspruch nach § 24 HVertrG (Durchschnitt der letzten 12 Monate)

---

# KATEGORIE 5 — Schulungen & Skripte

## S01 — Wo finde ich die Skripte? — [TODO Lukas]

## S02 — Wo finde ich Tests / Prüfungen? — [TODO Lukas]

## S03 — Wöchentliche Live-Trainings (PNV §1.2)

- **Dienstag 18:00** — Opening
- **Mittwoch 18:00** — Analyse
- **Donnerstag 17:00** — Strategie
- **Freitag 16:00** — Roleplay

[TODO Lukas: Zoom-Link?]

---

# KATEGORIE 6 — Kapazität & Projektwünsche

## K01 — Projektwunsch melden

[TODO Lukas: an wen, wie?]

---

# Meta

## M01 — Wie nutze ich diesen Hilfebereich?

1. **Suche** (⌘K oder Suchleiste)
2. **Themen-Kategorien** durchstöbern
3. **AI-Chat (Sandy)** öffnen, wenn die Suche nichts brachte
4. **An Support eskalieren**, wenn Sandy nicht weiterhilft. Ein Klick öffnet das Eskalations-Formular, das ein Ticket in unserer Inbox erstellt. Antwort innerhalb von 24h an Werktagen.

## M02 — Reaktionszeiten

Mo–Fr 09:00–17:00 CET. Max. 24h Reaktionszeit an Werktagen (PNV-AGB §12).

---

# Eskalations-Matrix (für AI-Routing & Intercom-Tags)

| Thema | Email | Intercom-Tag |
|---|---|---|
| **Abrechnungs-Einwände** | `accounting@salesdrive.at` | `abrechnung` |
| **Allgemein** | `office@salesdrive.at` | `allgemein` |
| **HVV / Vertrag** | [TODO] | `vertrag` |
| **Projekt-Onboarding** | [TODO — Alex?] | `projekt` |
| **Technische Probleme** | [TODO] | `technik` |
| **Beschwerden** | [TODO — Alex direkt?] | `beschwerde` |
| **Kündigung** | [TODO] | `kuendigung` |
| **Kapazität** | [TODO] | `kapazitaet` |

---

# Artikel-Schema (für Astro Content Collections)

```yaml
---
title: "Wann werde ich ausbezahlt?"
slug: "auszahlungstermin"
category: "abrechnung"
priority: 1                    # 1 = featured, 2 = normal, 3 = niedrig
keywords: ["auszahlung", "provision", "zahlung", "1. des monats"]
related: ["kontoblatt-verstehen", "fehlende-anrufe-melden"]
last_updated: "2026-05-14"
escalate_to: "accounting@salesdrive.at"
escalate_tag: "abrechnung"
tldr: "Am 1. jedes Monats für den Vormonat. Mindestbetrag 50 €."
status: "complete"             # complete | partial | todo
---
```

---

# Phase-1-Pflichtartikel

**Status `complete` (Inhalt vollständig, kann live):**
1. A01 — Wann werde ich ausbezahlt?
2. A02 — Einsendeschluss (mit TODO-Box wegen Widerspruch)
3. A03 — Vergütungsberechnung mit Beispiel
4. A04 — Konversionsgarantie 1:100
5. A05 — Kontoblatt-Begriffe
6. A06 — Fehlende Aktivitäten melden
7. A07 — Was zählt als Wählversuch?
8. A08 — Was zählt als Analysegespräch?
9. A09 — Mindestauszahlung 50 €
10. A12 — Ausbildungskosten verrechnen
11. P01 — Projekt-Onboarding
12. V01 — HVV-Überblick
13. V03 — Gewerbe & Steuer (mit Hinweis auf Steuerberater)
14. V06 — Kündigung
15. S03 — Live-Trainings-Termine
16. M01 — Wie nutze ich den Hilfebereich?
17. M02 — Reaktionszeiten
18. A11 — Rückhaltequote [partial → wird mit TODO-Box gerendert]
19. A10 — Empfehlungsprovision [partial → TODO-Box]
20. V04 — Reverse Charge [partial → Steuerberater-Disclaimer]

**Status `todo` (Stub mit Warn-Box, Eskalation zu Chat):**
- T01 — Close ↔ Email
- T03 — Analysegespräche AI Fehler
- T05 — Triangility
- P02 — Projekt-Zugangsdaten
- V02 — Unterlagen einsenden
- S01/S02 — Skripte / Tests

---

# RAG-Kontext für den AI-Chatbot

Bei jeder Chat-Anfrage erhält Claude Haiku 4.5 als Kontext (semantic search top-K):
1. Diese Wissensdatenbank (als chunks)
2. Den vollständigen HVV (als chunks)
3. Den vollständigen PNV inkl. AGB (als chunks)

**System-Prompt-Kern:**

> Du bist "Sandy", der Hilfe-Assistent für SalesAgents von SalesDrive.
> - Antworte in Du-Form, auf Deutsch
> - Sei präzise: zitiere Vertragsparagraphen wo relevant ("Laut HVV §4.5 …")
> - Wenn du dir unsicher bist: ehrlich sagen "Das weiß ich nicht sicher" und zur Eskalation raten
> - Bei rechtlich heiklen Themen (Steuer, Kündigung, Vertragsstrafen): immer auf Steuerberater oder Support verweisen
> - Niemals Beträge, Fristen, Prozesse erfinden, die nicht in der Wissensdatenbank stehen
> - Nach 3 erfolglosen Versuchen: aktiv Eskalation vorschlagen

**Eskalations-Output-Schema** (wenn AI eskaliert):
```json
{
  "category": "abrechnung",
  "summary": "Agent fragt nach fehlenden Wählversuchen im April. Konnte über Standard-Prozess (Mail an accounting@) hinaus nicht weiterhelfen. Spezifisches Detail: Agent hat unter altem Account (vor Anlegen) Aktivitäten erfasst.",
  "recommended_route": "accounting@salesdrive.at"
}
```
