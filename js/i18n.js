/* Sprachumschaltung Englisch (Hauptsprache) / Deutsch / Französisch.
   Statische Inhalte: Elemente mit data-lang="en" | "de" | "fr" (per CSS ein- und ausgeblendet).
   Dynamische Inhalte: I18N.t(deutsch, englisch) – Französisch kommt aus dem Wörterbuch window.FR_UI (Schlüssel: englischer Text).
   I18N.pick({ en, de, fr }) wählt einen Text direkt. I18N.data() liefert die übersetzten Daten (window.EN oder window.FR). */
(function () {
  "use strict";
  var KEY = "isp-lang";
  var LANGS = ["en", "de", "fr"];
  var lang = "";
  try { lang = localStorage.getItem(KEY) || ""; } catch (e) { lang = ""; }
  if (LANGS.indexOf(lang) < 0) lang = "en";
  var listeners = [];

  function apply() {
    var root = document.documentElement;
    root.lang = lang;
    Array.prototype.forEach.call(document.querySelectorAll("[data-ph-" + lang + "]"), function (el) {
      el.setAttribute("placeholder", el.getAttribute("data-ph-" + lang));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-setlang]"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-setlang") === lang ? "true" : "false");
    });
  }

  window.I18N = {
    get lang() { return lang; },
    langs: LANGS,
    t: function (de, en) {
      if (lang === "de") return de;
      if (lang === "fr") { var fr = window.FR_UI && en != null ? window.FR_UI[en] : null; if (fr != null) return fr; }
      return en != null ? en : de;
    },
    pick: function (o) { return o[lang] != null ? o[lang] : (o.en != null ? o.en : o.de); },
    locale: function () { return { en: "en-GB", de: "de-DE", fr: "fr-FR" }[lang]; },
    // übersetzte Datenquelle der aktuellen Sprache (Deutsch = Basisdaten → null)
    data: function () { return lang === "de" ? null : (lang === "fr" ? window.FR || {} : window.EN || {}); },
    set: function (l) {
      if (LANGS.indexOf(l) < 0 || l === lang) return;
      lang = l;
      try { localStorage.setItem(KEY, l); } catch (e) {}
      apply();
      listeners.forEach(function (fn) { try { fn(lang); } catch (e) { if (window.console) console.error(e); } });
    },
    onChange: function (fn) { listeners.push(fn); }
  };

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-setlang]");
    if (b) window.I18N.set(b.getAttribute("data-setlang"));
  });
  apply();
})();
