/*
  Erzeugt englische Preprint-Fassungen aller Beiträge für Repositorien wie ResearchGate oder Zenodo:
  preprints/<nr>_<kurztitel>.pdf mit Sora Pazer als alleiniger Autorin bzw. alleinigem Autor,
  dazu preprints/METADATEN.txt mit Titel, Abstract, Schlagwörtern und Datum zum Einfügen in die Upload-Formulare.
  Der Ordner preprints/ wird nicht veröffentlicht (.gitignore).

  Aufruf (im Ordner institut):  node werkzeuge/preprints-erzeugen.js
*/
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "preprints");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const w = {};
new Function("window", fs.readFileSync(path.join(ROOT, "data", "journal.js"), "utf8"))(w);
new Function("window", fs.readFileSync(path.join(ROOT, "data", "en", "journal.js"), "utf8"))(w);
const J = w.JOURNAL, JE = w.EN.journal;
const TYP = { "Editorial": "Editorial", "Übersichtsarbeit": "Review", "Originalarbeit": "Original article", "Theoretischer Beitrag": "Theoretical article", "Methodenbeitrag": "Methods article", "Praxis und Lehre": "Practice and teaching", "Rezension": "Book review" };
const MON = { "April": ["April", "04"], "Oktober": ["October", "10"] };
const slug = t => t.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 6).join("-");

(async () => {
  const opts = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
  const browser = await chromium.launch(opts);
  const page = await browser.newPage();
  let meta = "PREPRINTS – METADATEN FÜR RESEARCHGATE / ZENODO\n" +
    "Publikationstyp: Preprint · Autor: Sora Pazer · Institution: Institute for Meaning-Centered Psychology · Lizenz: CC BY 4.0 · Sprache: English\n\n";
  let n = 0;
  for (const a of J.artikel) {
    n++;
    const ae = JE.artikel[a.id] || {};
    const iss = J.ausgaben.find(x => x.id === a.ausgabe);
    const titel = ae.titel || a.titel, unter = ae.untertitel || a.untertitel;
    const file = String(n).padStart(2, "0") + "_" + slug(titel) + ".pdf";
    await page.goto("file://" + path.join(__dirname, "artikel-vorlage.html") + "#rg:" + a.id);
    await page.reload();
    await page.waitForFunction(() => window.ARTIKEL_BEREIT === true);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(OUT, file), preferCSSPageSize: true, printBackground: true });
    meta += "=".repeat(78) + "\n" + String(n).padStart(2, "0") + "  Datei: " + file + "\n" + "=".repeat(78) + "\n" +
      "Title:\n" + titel + (unter ? ": " + unter : "") + "\n\n" +
      "Type: Preprint (" + TYP[a.rubrik] + ")\n" +
      "Date: " + MON[iss.monat][0] + " " + iss.jahr + " (" + iss.jahr + "-" + MON[iss.monat][1] + ")\n" +
      "Author: Sora Pazer\nInstitution: Institute for Meaning-Centered Psychology\n" + (a.doi ? "DOI: " + a.doi + "\n" : "") + "\n" +
      "Abstract:\n" + a.abstractEn + "\n\n" +
      "Keywords:\n" + (a.keywords || []).join(", ") + "\n\n" +
      "Additional information:\nPreprint, not peer reviewed. Written with the assistance of generative AI and reviewed by the author. License: CC BY 4.0. https://imcp-institute.org\n\n";
    console.log(file);
  }
  fs.writeFileSync(path.join(OUT, "METADATEN.txt"), meta);
  await browser.close();
})();
