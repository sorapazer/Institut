/*
  Erzeugt die PDF-Fassungen aller Beiträge (pdf/<sprache>/<id>.pdf) und je Heft eine
  Gesamtausgabe (pdf/<sprache>/zsp-<jahr>-<heft>-gesamt.pdf) für Englisch (Original),
  Deutsch und Französisch. Die Seitenzahlen der englischen Originalfassung werden fortlaufend
  über den Jahrgang vergeben und in data/journal.js zurückgeschrieben.

  Aufruf (im Ordner institut):  node werkzeuge/pdf-erzeugen.js
  Voraussetzungen: Node.js, Playwright mit Chromium, Python 3 mit pypdf, poppler-utils (pdfinfo)
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "pdf");
const JFILE = path.join(ROOT, "data", "journal.js");
fs.mkdirSync(OUT, { recursive: true });

function loadJournal() { const w = {}; new Function("window", fs.readFileSync(JFILE, "utf8"))(w); return w.JOURNAL; }
function pages(file) { return +/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [file]).toString())[1]; }
function setSeiten(id, seiten) {
  let src = fs.readFileSync(JFILE, "utf8");
  const re = new RegExp('(id:\\s*"' + id + '"[\\s\\S]*?seiten:\\s*")[^"]*(")');
  src = src.replace(re, "$1" + seiten + "$2");
  fs.writeFileSync(JFILE, src);
}

(async () => {
  const opts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : (fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const browser = await chromium.launch(opts);
  const page = await browser.newPage();
  async function render(file, hash, target) {
    await page.goto("file://" + path.join(__dirname, file) + "#" + hash);
    await page.reload();
    await page.waitForFunction(() => window.ARTIKEL_BEREIT === true || window.HEFT_BEREIT === true);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: target, preferCSSPageSize: true, printBackground: true });
  }
  const hasFr = fs.existsSync(path.join(ROOT, "data", "fr", "journal.js"));
  const LANGS = hasFr ? ["en", "de", "fr"] : ["en", "de"];
  for (const L of LANGS) fs.mkdirSync(path.join(OUT, L), { recursive: true });

  // 1. Englische Originalfassung: fortlaufende Seitenzählung im Jahrgang, Rückschreiben nach data/journal.js
  let J = loadJournal();
  let next = 1;
  for (const a of J.artikel) {
    for (let pass = 0; pass < 3; pass++) {
      J = loadJournal();
      const cur = J.artikel.find(x => x.id === a.id);
      const start = parseInt(String(cur.seiten).split(/[–-]/)[0], 10);
      const file = path.join(OUT, "en", a.id + ".pdf");
      await render("artikel-vorlage.html", "en:" + a.id, file);
      const n = pages(file);
      const seiten = n === 1 ? String(next) : next + "–" + (next + n - 1);
      if (start === next && cur.seiten === seiten) { console.log("en", a.id, seiten); next += n; break; }
      setSeiten(a.id, seiten);
    }
  }
  J = loadJournal();
  // 2. Übersetzungen (eigene Seitenzählung)
  for (const L of LANGS.filter(l => l !== "en")) {
    for (const a of J.artikel) { await render("artikel-vorlage.html", L + ":" + a.id, path.join(OUT, L, a.id + ".pdf")); }
    console.log(L, "fertig");
  }
  // 3. Gesamthefte je Sprache
  for (const L of LANGS) {
    for (const iss of J.ausgaben) {
      const arts = J.artikel.filter(x => x.ausgabe === iss.id);
      const cover = path.join(OUT, L, "_titel-" + iss.id + ".pdf");
      await render("heft-titel.html", L + ":" + iss.id, cover);
      const target = path.join(OUT, L, "zsp-" + iss.jahr + "-" + iss.heft + "-gesamt.pdf");
      const title = { en: "Journal of Meaning-Centered Psychology", de: "Zeitschrift für Sinnzentrierte Psychologie", fr: "Revue de psychologie centrée sur le sens" }[L] + ", " + iss.heft + "/" + iss.jahr;
      execFileSync("python3", ["-c", "import sys\nfrom pypdf import PdfWriter\nw = PdfWriter()\nfor f in sys.argv[3:]:\n    w.append(f)\nw.add_metadata({'/Title': sys.argv[2], '/Author': 'Institute for Meaning-Centered Psychology'})\nw.write(sys.argv[1])\n",
        target, title, cover, ...arts.map(x => path.join(OUT, L, x.id + ".pdf"))]);
      fs.unlinkSync(cover);
      console.log(L, "Heft", iss.id);
    }
  }
  await browser.close();
})();
