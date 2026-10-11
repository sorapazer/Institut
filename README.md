# Institut für Sinnzentrierte Psychologie

Statische Website (HTML, CSS, JavaScript) mit Fachzeitschrift, Fachlexikon und Online-Akademie, zweisprachig Deutsch/Englisch.

## Veröffentlichung
Die Seite wird über GitHub Pages aus dem Branch `main` (Ordner `/`) ausgeliefert. Ein Build-Schritt ist nicht nötig.

## Aufbau
- `index.html` – Einstiegsseite mit allen Ansichten
- `css/` – Gestaltung, `css/fonts.css` bindet die lokal liegenden Schriften aus `fonts/` ein
- `js/` – `i18n.js` (Sprachumschaltung), `app.js` (Seiten, Lexikon, Zeitschrift), `akademie.js` (Kurse, Prüfung, Zertifikat)
- `data/` – Inhalte (Lexikon, Zeitschrift, Verfahren, Kurse); englische Fassungen in `data/en/`
- `pdf/` – Satzfassungen der Zeitschrift, englisch in `pdf/en/`
- `vorlagen/` – Manuskriptvorlage für Einreichungen
- `werkzeuge/` – Druckvorlagen und Skript zum Erzeugen der PDFs (`node werkzeuge/pdf-erzeugen.js`, benötigt Playwright, Python mit pypdf und poppler-utils)

## Anpassen
- Kontaktadresse: `KONTAKT` oben in `js/app.js`
- Preise und Gutscheincodes: `data/kurse/kurse.js`
