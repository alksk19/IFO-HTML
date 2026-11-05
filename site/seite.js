/* ---------------------------------------------------------------------------
   seite.js — Vorlage für die einfacheren Themenseiten

   Exporterwartungen, Importklima und Beschäftigungsbarometer sind gleich
   aufgebaut: Kennzahl, Verlaufsdiagramm mit Tabelle, bei Bedarf ein
   Bereichsabschnitt und eine Schicht "Mehr Details" mit der langen
   Zeitreihe. Diese Datei haelt diesen Aufbau an einer Stelle; die Seiten
   selbst enthalten nur noch ihren Text und einen Aufruf von
   SEITE.aufbauen().

   Die Geschäftsklima-Seite nutzt die Vorlage bewusst nicht: sie ist der
   ausgebaute Pilot mit Kennzahlen, Heatmap und Unsicherheitsreihe.
--------------------------------------------------------------------------- */

window.SEITE = (function () {
  "use strict";

  /*
    aufbauen({
      dataset, series, sector   Hauptreihe der Seite
      kennzahlTitel,
      kennzahlZusatz            Beschriftung der Kennzahlkachel
      chartId, chartTitel       Verlaufsdiagramm
      stellen                   Dezimalstellen (Vorgabe 1)
      nullLinie                 true, wenn die Reihe um null schwankt
      langTitel, langHinweis    lange Zeitreihe in "Mehr Details"
      quellenZusatz             zusaetzliche Quellenangaben als Liste
      bereiche                  optional {ziel, namen, nullLinie}
    })
  */
  function aufbauen(o) {
    APP.rahmenAufbauen();

    const stellen = o.stellen === undefined ? 1 : o.stellen;
    const haupt = APP.serie(o.dataset, o.series, o.sector);

    /* --- Kennzahlkachel ------------------------------------------------- */

    const kz = document.getElementById("kennzahlen");
    const a = APP.aktuell(haupt);

    if (kz && a) {
      let klasse = "null", pfeil = "±";
      if (a.delta > 0) { klasse = "auf"; pfeil = "▲"; }
      else if (a.delta < 0) { klasse = "ab"; pfeil = "▼"; }

      const el = document.createElement("div");
      el.className = "tile";
      el.innerHTML =
        '<div class="tile-titel">' + APP.escape(o.kennzahlTitel) + "</div>" +
        '<div class="wert">' + APP.zahl(a.wert, stellen) + "</div>" +
        '<div class="einheit">' + APP.escape(o.kennzahlZusatz || haupt.unit) + "</div>" +
        '<div class="delta ' + klasse + '">' + pfeil + " " +
          APP.zahlMitVorzeichen(a.delta, stellen) + " zum Vormonat</div>" +
        '<div class="sparkline"></div>' +
        '<div class="stand">Stand: ' + APP.monatLang(a.monat) + "</div>";
      kz.appendChild(el);

      const von = Math.max(0, haupt.values.length - 120);
      APP.sparkline(el.querySelector(".sparkline"),
                    haupt.values.slice(von), haupt.dates.slice(von));
    }

    /* --- Verlauf -------------------------------------------------------- */

    const verlauf = document.getElementById("verlauf");
    if (verlauf) {
      APP.chartBlock(verlauf, {
        id: o.chartId,
        titel: o.chartTitel,
        serien: [haupt],
        stellen: stellen,
        nullLinie: o.nullLinie === true,
        zeitraum: "10j",
        tabelleMonate: 6
      });
    }

    /* --- Wirtschaftsbereiche (optional) --------------------------------- */

    if (o.bereiche) {
      const ziel = document.getElementById(o.bereiche.ziel);
      if (ziel) {
        o.bereiche.namen.forEach(function (name) {
          const s = APP.serie(o.dataset, o.series, name);
          if (!s) return;

          const h3 = document.createElement("h3");
          h3.style.marginTop = "28px";
          h3.textContent = name;
          ziel.appendChild(h3);

          APP.chartBlock(ziel, {
            id: "chart-" + name.toLowerCase()
                  .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
                  .replace(/[^a-z]+/g, "-"),
            titel: APP.label(o.series) + " " + name,
            serien: [s],
            stellen: stellen,
            nullLinie: o.bereiche.nullLinie === true,
            zeitraum: "10j",
            tabelleMonate: 6,
            klein: true
          });
        });
      }
    }

    /* --- Mehr Details --------------------------------------------------- */

    // Ueberschrift, Aufklapp-Beschriftung und Einleitungssatz stehen im HTML
    // der jeweiligen Seite, damit die sichtbaren Woerter dort zu finden und zu
    // aendern sind. Hier werden nur Quellenkasten und Diagramme eingehaengt.
    const details = document.getElementById("details");
    if (details) {
      const inhalt = details.querySelector(".inhalt");

      // Quellenangaben stehen sofort bereit, das Diagramm wird erst beim
      // Öffnen aufgebaut.
      const quellen = document.createElement("div");
      quellen.className = "quelle-kasten";
      let qh = "<p style=\"margin:0 0 6px\"><strong>Quelle</strong><br>" +
               APP.escape(haupt.source) + "</p>" +
               '<p style="margin:0 0 6px">Zeitraum: ' +
               APP.escape(APP.monatLang(haupt.start)) + " bis " +
               APP.escape(APP.monatLang(haupt.end)) + " · " +
               haupt.values.length + " Monatswerte · Einheit laut Quelldatei: " +
               APP.escape(haupt.unit) + "</p>";
      (o.quellenZusatz || []).forEach(function (q) {
        qh += '<p style="margin:0 0 6px">' + APP.escape(q) + "</p>";
      });
      quellen.innerHTML = qh;
      inhalt.appendChild(quellen);

      let aufgebaut = false;
      details.addEventListener("toggle", function () {
        if (!details.open || aufgebaut) return;
        aufgebaut = true;

        APP.chartBlock(inhalt, {
          id: o.chartId + "-lang",
          titel: o.langTitel,
          serien: [haupt],
          stellen: stellen,
          nullLinie: o.nullLinie === true,
          zeitraum: "alle",
          tabelleMonate: 6,
          hinweis: o.langHinweis
        });

        // Bei Seiten mit Bereichen zusätzlich alle Bereiche in einem
        // Diagramm, damit sie sich vergleichen lassen. Mehr als drei Serien
        // werden nicht in ein Diagramm gelegt, deshalb zwei Diagramme.
        if (o.bereiche) {
          const serien = o.bereiche.namen.map(function (n) {
            return APP.serie(o.dataset, o.series, n);
          }).filter(Boolean);

          for (let i = 0; i < serien.length; i += 3) {
            const teil = serien.slice(i, i + 3);
            APP.chartBlock(inhalt, {
              id: o.chartId + "-bereiche-" + (i / 3 + 1),
              titel: "Wirtschaftsbereiche im Vergleich (" +
                     teil.map(function (s) { return APP.label(s.sector); }).join(", ") + ")",
              serien: teil,
              legende: teil.map(function (s) { return APP.label(s.sector); }),
              stellen: stellen,
              nullLinie: o.bereiche.nullLinie === true,
              zeitraum: "alle",
              tabelleMonate: 6
            });
          }
        }
      });
    }

    APP.ankerAnspringen();
  }

  return { aufbauen: aufbauen };
})();
