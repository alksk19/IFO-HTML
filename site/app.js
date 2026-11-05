/* ---------------------------------------------------------------------------
   app.js — gemeinsame Bausteine aller Seiten

   Enthaelt den Chart-Baustein, der auf jeder Themenseite gleich verwendet
   wird: Diagramm, Werkzeugleiste (Bild kopieren, PNG, Daten als CSV, Link),
   Zeitraumschalter und die zugehoerige Datentabelle.

   Die Daten stammen aus window.SITE_DATA (site/data.js, erzeugt von
   R/build_data.R). Es wird nichts per fetch() geladen, damit index.html
   direkt von der Festplatte geoeffnet werden kann.
--------------------------------------------------------------------------- */

(function () {
  "use strict";

  const DATA = window.SITE_DATA;
  const CFG = window.SITE;

  if (!DATA) { console.error("site/data.js fehlt — Rscript R/build_data.R ausfuehren."); return; }

  // Schriftstack fuer alles, was auf Canvas gezeichnet wird (Sparklines und
  // PNG-Export). Muss zur Angabe in styles.css passen, sonst stehen die
  // exportierten Bilder in einer anderen Schrift als die Seite.
  const SCHRIFT = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", ' +
                  'Roboto, "Helvetica Neue", Arial, sans-serif';
  if (window.Chart) Chart.defaults.font.family = SCHRIFT;

  // Der Datenstand kommt aus den Daten selbst (R/build_data.R leitet ihn aus
  // dem Dateinamen der Rohdatei ab). So stimmt er nach einem Update von allein;
  // der Eintrag in config.js dient nur noch als Rueckfallebene.
  function stand() {
    return DATA.stand ? monatLang(DATA.stand) : (CFG.stand || "");
  }

  // Canvas zeichnet mit der Schrift, die im Moment des Zeichnens geladen ist.
  // Bei font-display: swap kann das beim ersten Aufbau noch der Fallback sein;
  // die Diagramme werden deshalb nachgezeichnet, sobald Inter steht. Die
  // Sparklines beschriften nichts und bleiben davon unberuehrt.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (!window.Chart || !Chart.instances) return;
      Object.keys(Chart.instances).forEach(function (k) {
        try { Chart.instances[k].update("none"); } catch (e) { /* egal */ }
      });
    });
  }

  /* --- Zahlen und Monate ------------------------------------------------- */

  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni",
                  "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const MONATE_KURZ = ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun",
                       "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  // "2026-10" -> "Oktober 2026"
  function monatLang(m) {
    return MONATE[+m.slice(5, 7) - 1] + " " + m.slice(0, 4);
  }
  // "2026-10" -> "Okt 2026"
  function monatKurz(m) {
    return MONATE_KURZ[+m.slice(5, 7) - 1] + " " + m.slice(0, 4);
  }
  // "2026-10" -> "10/2026", wie in den Quelldateien
  function monatZiffern(m) {
    return m.slice(5, 7) + "/" + m.slice(0, 4);
  }

  // Deutsche Schreibweise mit Dezimalkomma.
  // Anzeigeformat: deutsches Dezimalkomma und ein echtes Minuszeichen (U+2212)
  // statt des Bindestrichs - es steht auf der Hoehe des Pluszeichens und ist
  // genauso breit wie eine Ziffer. Die CSV-Ausgabe nutzt diese Funktion nicht
  // und behaelt die Rohwerte.
  function zahl(v, stellen) {
    if (v === null || v === undefined || Number.isNaN(v)) return "–";
    const s = (stellen === undefined) ? 1 : stellen;
    return v.toLocaleString("de-DE", { minimumFractionDigits: s, maximumFractionDigits: s })
            .replace("-", "−");
  }

  function zahlMitVorzeichen(v, stellen) {
    if (v === null || v === undefined || Number.isNaN(v)) return "–";
    return (v > 0 ? "+" : "") + zahl(v, stellen);
  }

  function label(name) {
    return (CFG && CFG.labels && CFG.labels[name]) || name;
  }

  /* --- Zugriff auf die Daten -------------------------------------------- */

  // Liefert eine Serie als {series, sector, unit, source, dates, values}.
  function serie(dataset, series, sector) {
    const liste = DATA.datasets[dataset];
    if (!liste) { console.warn("Unbekannter Datensatz: " + dataset); return null; }
    const s = liste.find(function (x) {
      return x.series === series && (sector === undefined || x.sector === sector);
    });
    if (!s) console.warn("Unbekannte Serie: " + dataset + " / " + series + " / " + sector);
    return s || null;
  }

  /* --- Quellenangabe mit Link auf die ifo-Seite ------------------------- */

  // Die Serienobjekte aus data.js tragen keinen Datensatznamen. Fuer den Link
  // wird deshalb nachgeschlagen, in welchem Datensatz das Objekt liegt.
  function datensatzVon(s) {
    if (!s) return null;
    const namen = Object.keys(DATA.datasets || {});
    for (let i = 0; i < namen.length; i++) {
      if ((DATA.datasets[namen[i]] || []).indexOf(s) > -1) return namen[i];
    }
    return null;
  }

  // Liefert die Quellenangabe als HTML; ist eine ifo-Seite hinterlegt, wird
  // die Angabe zum Link dorthin. Ohne Hinterlegung bleibt sie reiner Text.
  function quelleHtml(s) {
    const text = escape((s && s.source) || "");
    const url = (CFG.quellenLinks || {})[datensatzVon(s)];
    if (!url) return text;
    return '<a href="' + escape(url) + '" target="_blank" rel="noopener">' + text + "</a>";
  }

  // Letzter Wert, Vormonatswert und Veraenderung einer Serie.
  function aktuell(s) {
    if (!s || !s.values.length) return null;
    const n = s.values.length;
    const wert = s.values[n - 1];
    const vor = n > 1 ? s.values[n - 2] : null;
    return {
      monat: s.dates[n - 1],
      wert: wert,
      vormonat: vor,
      delta: (vor === null) ? null : Math.round((wert - vor) * 1000) / 1000
    };
  }

  /* --- Zeitraeume -------------------------------------------------------- */

  const ZEITRAEUME = [
    { id: "2j", text: "2 J.", monate: 24 },
    { id: "10j", text: "10 J.", monate: 120 },
    { id: "alle", text: "Alle", monate: null }
  ];

  // Schneidet mehrere Serien auf denselben Zeitraum zu. Der Zeitraum bezieht
  // sich auf den letzten Monat, zu dem irgendeine der Serien Daten hat.
  function zuschneiden(serien, monate) {
    const alle = [];
    serien.forEach(function (s) { if (s) alle.push.apply(alle, s.dates); });
    if (!alle.length) return { monate: [], spalten: [] };

    let monateSortiert = Array.from(new Set(alle)).sort();
    if (monate) monateSortiert = monateSortiert.slice(-monate);

    const spalten = serien.map(function (s) {
      if (!s) return [];
      const index = new Map();
      s.dates.forEach(function (d, i) { index.set(d, s.values[i]); });
      return monateSortiert.map(function (m) {
        return index.has(m) ? index.get(m) : null;
      });
    });
    return { monate: monateSortiert, spalten: spalten };
  }

  /* --- Farben ------------------------------------------------------------ */

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function serienfarben() {
    return [css("--series-1"), css("--series-2"), css("--series-3")];
  }

  /* --- Dateinamen und Downloads ----------------------------------------- */

  function dateiname(titel, endung) {
    const basis = titel
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return basis + "." + endung;
  }

  function herunterladen(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* --- CSV im Browser erzeugen ------------------------------------------ */

  // Erzeugt eine CSV im Langformat (eine Zeile je Monat und Serie) mit
  // denselben Spalten wie die Dateien in data/clean/. Trennzeichen ist das
  // Semikolon und das Dezimaltrennzeichen das Komma, damit die Datei sich in
  // einem deutschsprachigen Excel ohne Importdialog oeffnet.
  function csvText(serien, ausschnitt, kopfzeilen) {
    const zeilen = [];
    (kopfzeilen || []).forEach(function (z) { zeilen.push("# " + z); });
    zeilen.push(["date", "series", "sector", "value", "unit", "source"].join(";"));

    ausschnitt.monate.forEach(function (m, i) {
      serien.forEach(function (s, k) {
        if (!s) return;
        const v = ausschnitt.spalten[k][i];
        if (v === null || v === undefined) return;
        zeilen.push([
          m,
          label(s.series),
          label(s.sector),
          String(v).replace(".", ","),
          s.unit,
          s.source
        ].map(feld).join(";"));
      });
    });
    return zeilen.join("\r\n") + "\r\n";
  }

  function feld(v) {
    const s = String(v);
    return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function csvHerunterladen(serien, ausschnitt, titel, kopfzeilen) {
    // BOM voranstellen, damit Excel die Umlaute korrekt liest.
    const blob = new Blob(["﻿" + csvText(serien, ausschnitt, kopfzeilen)],
                          { type: "text/csv;charset=utf-8" });
    herunterladen(blob, dateiname(titel, "csv"));
  }

  /* --- Bild: PNG und Zwischenablage ------------------------------------- */

  // Das Chart-Canvas ist transparent. Fuer Export und Zwischenablage wird es
  // auf einen deckenden Hintergrund kopiert und mit einer Fusszeile
  // (Quelle und Prototyp-Hinweis) versehen, damit ein weitergegebenes Bild
  // seine Herkunft mitbringt.
  function bildCanvas(chart, titel, quelle) {
    const src = chart.canvas;
    const skala = window.devicePixelRatio > 1 ? 2 : 1;
    const rand = 16 * skala;
    const kopfH = 34 * skala;
    const fussH = 34 * skala;

    const out = document.createElement("canvas");
    out.width = src.width + rand * 2;
    out.height = src.height + kopfH + fussH;

    const g = out.getContext("2d");
    g.fillStyle = css("--surface") || "#ffffff";
    g.fillRect(0, 0, out.width, out.height);

    g.fillStyle = css("--text-primary") || "#000000";
    g.font = "600 " + (14 * skala) + "px " + SCHRIFT;
    g.textBaseline = "middle";
    g.fillText(titel, rand, kopfH / 2 + 2 * skala);

    g.drawImage(src, rand, kopfH);

    g.fillStyle = css("--text-muted") || "#777777";
    g.font = (11 * skala) + "px " + SCHRIFT;
    g.fillText("Quelle: " + quelle, rand, out.height - fussH / 2 - 6 * skala);
    g.fillText(CFG.disclaimer, rand, out.height - fussH / 2 + 8 * skala);

    return out;
  }

  function pngHerunterladen(chart, titel, quelle) {
    bildCanvas(chart, titel, quelle).toBlob(function (blob) {
      herunterladen(blob, dateiname(titel, "png"));
    }, "image/png");
  }

  function bildKopieren(chart, titel, quelle, melden) {
    const canvas = bildCanvas(chart, titel, quelle);
    if (!navigator.clipboard || !window.ClipboardItem) {
      melden("Bild kopieren wird von diesem Browser nicht unterstützt — bitte PNG verwenden.");
      return;
    }
    canvas.toBlob(function (blob) {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(function () { melden("Bild in die Zwischenablage kopiert."); })
        .catch(function () { melden("Kopieren nicht möglich — bitte PNG verwenden."); });
    }, "image/png");
  }

  function linkKopieren(id, melden) {
    const url = location.href.split("#")[0] + "#" + id;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(function () { melden("Link kopiert"); })
        .catch(function () { melden("Kopieren nicht möglich"); });
    } else {
      melden("Kopieren nicht möglich");
    }
    history.replaceState(null, "", "#" + id);
  }

  /* --- Chart.js --------------------------------------------------------- */

  function chartVorhanden() {
    return typeof window.Chart !== "undefined";
  }

  function linienChart(canvas, ausschnitt, serien, optionen) {
    const farben = serienfarben();
    const datasets = serien.map(function (s, i) {
      return {
        label: optionen.legende ? optionen.legende[i] : label(s.series),
        data: ausschnitt.spalten[i],
        borderColor: farben[i % farben.length],
        backgroundColor: farben[i % farben.length],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 14,
        tension: 0.15,
        spanGaps: false
      };
    });

    const nullLinie = optionen.nullLinie === true;

    return new window.Chart(canvas, {
      type: "line",
      data: { labels: ausschnitt.monate.map(monatKurz), datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 4, right: 6, bottom: 0, left: 0 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: css("--text-primary"),
            titleColor: css("--surface"),
            bodyColor: css("--surface"),
            borderWidth: 0,
            padding: 10,
            displayColors: true,
            boxWidth: 9,
            boxHeight: 9,
            usePointStyle: false,
            callbacks: {
              title: function (items) { return monatLang(ausschnitt.monate[items[0].dataIndex]); },
              label: function (item) {
                return item.dataset.label + ": " + zahl(item.parsed.y, optionen.stellen);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: css("--axis") },
            ticks: {
              color: css("--text-muted"),
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 9
            }
          },
          y: {
            grid: { color: css("--grid"), drawTicks: false },
            border: { display: false },
            ticks: {
              color: css("--text-muted"),
              font: { size: 11 },
              padding: 8,
              callback: function (v) { return zahl(v, 0); }
            },
            ...(nullLinie ? {} : {})
          }
        }
      },
      plugins: nullLinie ? [nullLinienPlugin()] : []
    });
  }

  // Hebt die Nulllinie hervor — bei Salden ist das Vorzeichen die
  // eigentliche Aussage.
  function nullLinienPlugin() {
    return {
      id: "nulllinie",
      beforeDatasetsDraw: function (chart) {
        const y = chart.scales.y;
        if (!y || y.min > 0 || y.max < 0) return;
        const g = chart.ctx;
        const py = y.getPixelForValue(0);
        g.save();
        g.strokeStyle = css("--axis");
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(chart.chartArea.left, py);
        g.lineTo(chart.chartArea.right, py);
        g.stroke();
        g.restore();
      }
    };
  }

  /* --- Tabelle ---------------------------------------------------------- */

  // Monate als Zeilen, Serien als Spalten. Neuester Monat oben.
  function tabelleHtml(ausschnitt, serien, optionen) {
    const stellen = optionen.stellen === undefined ? 1 : optionen.stellen;
    const kopf = ["Monat"].concat(serien.map(function (s, i) {
      return optionen.legende ? optionen.legende[i] : label(s.series);
    }));

    let h = '<div class="tabelle-huelle"><table class="daten"><thead><tr>';
    kopf.forEach(function (k) { h += "<th>" + escape(k) + "</th>"; });
    h += "</tr></thead><tbody>";

    for (let i = ausschnitt.monate.length - 1; i >= 0; i--) {
      h += "<tr><td>" + monatZiffern(ausschnitt.monate[i]) + "</td>";
      serien.forEach(function (s, k) {
        h += "<td>" + zahl(ausschnitt.spalten[k][i], stellen) + "</td>";
      });
      h += "</tr>";
    }
    return h + "</tbody></table></div>";
  }

  function escape(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* --- Der Chart-Baustein ----------------------------------------------- */

  /*
    chartBlock(ziel, {
      id:        eindeutige Kennung, dient als Sprungziel und fuer "Link"
      titel:     Ueberschrift des Blocks
      serien:    Array von Serienobjekten (aus serie())
      legende:   optionale Beschriftungen, sonst die Seriennamen
      stellen:   Dezimalstellen (Vorgabe 1)
      nullLinie: true bei Salden
      zeitraum:  Vorgabe-Zeitraum ("2j" | "10j" | "alle")
      tabelle:   false, wenn keine Tabelle gewuenscht ist
      tabelleMonate: begrenzt die Tabelle auf die letzten n Monate; das
                 Diagramm und die CSV umfassen weiterhin den gewaehlten
                 Zeitraum
      hinweis:   optionaler Hinweis unter dem Diagramm
      klein:     true fuer die flachere Variante in Bereichsabschnitten
    })
  */
  function chartBlock(ziel, o) {
    const serien = o.serien.filter(Boolean);
    if (!serien.length) { ziel.innerHTML = '<p class="hinweis-klein">Keine Daten vorhanden.</p>'; return; }

    const stellen = o.stellen === undefined ? 1 : o.stellen;
    const tabelleId = o.id + "-daten";
    const quelle = serien[0].source;
    const einheiten = Array.from(new Set(serien.map(function (s) { return s.unit; })));

    let zeitraum = o.zeitraum || "10j";

    // Die Tabelle zeigt zunaechst wenige Monate und wird auf Klick einmalig
    // auf die groessere Zahl ergaenzt. Der Zustand liegt hier, damit er beim
    // Umschalten des Zeitraums erhalten bleibt.
    const TAB_WENIG = o.tabelleMonate || 6;
    const TAB_MEHR = o.tabelleMonateMehr || 12;
    let tabelleMehr = false;

    // --- Aufbau
    const block = document.createElement("div");
    block.className = "chart-block sprungziel";
    block.id = o.id;

    const kopf = document.createElement("div");
    kopf.className = "chart-kopf";
    kopf.innerHTML =
      '<div class="titelblock">' +
        "<h3>" + escape(o.titel) + "</h3>" +
        '<div class="einheit">' + escape(einheiten.join(" · ")) + "</div>" +
      "</div>";

    const werkzeuge = document.createElement("div");
    werkzeuge.className = "werkzeuge";

    const schalter = document.createElement("div");
    schalter.className = "bereich-schalter";
    schalter.setAttribute("role", "group");
    schalter.setAttribute("aria-label", "Zeitraum");
    ZEITRAEUME.forEach(function (z) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (z.id === zeitraum ? " aktiv" : "");
      b.textContent = z.text;
      b.dataset.zeitraum = z.id;
      b.addEventListener("click", function () {
        zeitraum = z.id;
        Array.prototype.forEach.call(schalter.children, function (c) {
          c.classList.toggle("aktiv", c.dataset.zeitraum === zeitraum);
        });
        zeichnen();
      });
      schalter.appendChild(b);
    });
    werkzeuge.appendChild(schalter);

    // "Daten" fuehrt auf die Datenseite, und zwar an den Abschnitt dieser
    // Reihe. Die Ankernamen folgen derselben Kennung wie das Diagramm, damit
    // beides zusammenpasst.
    const knoepfe = [
      ["Daten", function () { location.href = "daten.html#" + o.id; }],
      ["CSV", function () { csvHerunterladen(serien, ausschnitt(), o.titel, kopfzeilen()); }],
      ["PNG", function () { if (chart) pngHerunterladen(chart, o.titel, quelle); }],
      ["Bild kopieren", function () { if (chart) bildKopieren(chart, o.titel, quelle, melden); }],
      ["Link", function () { linkKopieren(o.id, melden); }]
    ];
    knoepfe.forEach(function (k) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = k[0];
      b.addEventListener("click", k[1]);
      werkzeuge.appendChild(b);
    });

    kopf.appendChild(werkzeuge);
    block.appendChild(kopf);

    // Legende: ab zwei Serien immer vorhanden, damit die Zuordnung nicht
    // allein an der Farbe haengt.
    if (serien.length > 1) {
      const farben = serienfarben();
      const leg = document.createElement("div");
      leg.className = "legende";
      serien.forEach(function (s, i) {
        const sp = document.createElement("span");
        const ic = document.createElement("i");
        ic.style.background = farben[i % farben.length];
        sp.appendChild(ic);
        sp.appendChild(document.createTextNode(o.legende ? o.legende[i] : label(s.series)));
        leg.appendChild(sp);
      });
      block.appendChild(leg);
    }

    const flaeche = document.createElement("div");
    flaeche.className = "chart-flaeche" + (o.klein ? " klein" : "");
    flaeche.title = "Antippen, um die Schaltflächen einzublenden";
    const canvas = document.createElement("canvas");
    flaeche.appendChild(canvas);
    block.appendChild(flaeche);

    // Die Werkzeuge erscheinen bei Mauszeiger darueber oder Tastaturfokus
    // (beides in styles.css). Ein Klick oder Tipp auf das Diagramm blendet sie
    // ebenfalls ein - auf Tastgeraeten gibt es kein Hover. Ein Tipp daneben
    // nimmt sie wieder weg.
    flaeche.addEventListener("click", function (e) {
      e.stopPropagation();
      document.querySelectorAll(".chart-block.offen").forEach(function (b) {
        if (b !== block) b.classList.remove("offen");
      });
      block.classList.add("offen");
    });
    document.addEventListener("click", function (e) {
      if (!block.contains(e.target)) block.classList.remove("offen");
    });

    const fuss = document.createElement("div");
    fuss.className = "chart-fuss";
    const spanne = document.createElement("span");
    const statusEl = document.createElement("span");
    statusEl.className = "kopier-status";
    statusEl.setAttribute("role", "status");
    fuss.appendChild(spanne);
    fuss.appendChild(statusEl);
    block.appendChild(fuss);

    if (o.hinweis) {
      const hw = document.createElement("p");
      hw.className = "hinweis-klein";
      hw.style.marginTop = "6px";
      hw.textContent = o.hinweis;
      block.appendChild(hw);
    }

    ziel.appendChild(block);

    // Datenabschnitt zum Diagramm.
    let tabelleEl = null;
    if (o.tabelle !== false) {
      tabelleEl = document.createElement("div");
      tabelleEl.className = "sprungziel";
      tabelleEl.id = tabelleId;
      ziel.appendChild(tabelleEl);
    }

    // --- Zustand und Zeichnen
    let chart = null;
    let meldeTimer = null;

    function melden(text) {
      statusEl.textContent = text;
      clearTimeout(meldeTimer);
      meldeTimer = setTimeout(function () { statusEl.textContent = ""; }, 6000);
    }

    function ausschnitt() {
      const z = ZEITRAEUME.find(function (x) { return x.id === zeitraum; });
      return zuschneiden(serien, z ? z.monate : null);
    }

    function kopfzeilen() {
      return [
        o.titel,
        "Quelle: " + quelle,
        CFG.disclaimer,
        "Erzeugt am " + new Date().toLocaleDateString("de-DE")
      ];
    }

    function zeichnen() {
      const a = ausschnitt();

      if (chart) { chart.destroy(); chart = null; }
      if (chartVorhanden()) {
        chart = linienChart(canvas, a, serien, {
          legende: o.legende, stellen: stellen, nullLinie: o.nullLinie
        });
      } else {
        flaeche.innerHTML = '<p class="hinweis-klein">Die Diagrammbibliothek konnte nicht geladen ' +
          "werden (dafür ist eine Internetverbindung nötig). Die Daten stehen in der Tabelle " +
          "darunter und als CSV weiterhin vollständig zur Verfügung.</p>";
      }

      if (a.monate.length) {
        // Nur Text, kein Link: die einzige Link-Funktion je Diagramm ist der
        // Knopf "Link". Der Hyperlink zur ifo-Seite steht auf der Datenseite
        // und der Methodikseite.
        spanne.textContent = monatLang(a.monate[0]) + " bis " +
          monatLang(a.monate[a.monate.length - 1]) +
          " · " + a.monate.length + " Monate · Quelle: " + quelle;
      }

      if (tabelleEl) tabelleZeichnen(a);
    }

    // Nur die Tabelle neu aufbauen, ohne das Diagramm anzufassen - damit der
    // Klick auf "Weitere Monate" nicht das ganze Diagramm neu zeichnet.
    function tabelleZeichnen(a) {
      // Die Tabelle wird auf die letzten n Monate gekuerzt, damit sie lesbar
      // bleibt. Diagramm und CSV umfassen weiterhin den gewaehlten Zeitraum;
      // der Hinweistext sagt genau das.
      const k = tabelleMehr ? TAB_MEHR : TAB_WENIG;
      let tab = a, erlaeuterung;
      if (a.monate.length > k) {
        tab = {
          monate: a.monate.slice(-k),
          spalten: a.spalten.map(function (sp) { return sp.slice(-k); })
        };
        erlaeuterung = "Letzte " + k + " Monate; CSV enthält den ganzen Zeitraum";
      } else {
        erlaeuterung = "Wie im Diagramm; CSV identisch";
      }
      tabelleEl.innerHTML =
        '<h3 style="margin-top:18px">Daten: ' + escape(o.titel) + "</h3>" +
        '<p class="hinweis-klein">' + erlaeuterung + "</p>" +
        tabelleHtml(tab, serien, { legende: o.legende, stellen: stellen });

      // Knopf nur, solange ungezeigte Monate uebrig sind. Ein Klick ergaenzt
      // dieselbe Tabelle auf TAB_MEHR Zeilen - es klappt nichts auf und
      // nichts zu.
      if (!tabelleMehr && a.monate.length > TAB_WENIG) {
        const mehr = document.createElement("button");
        mehr.type = "button";
        mehr.className = "btn";
        mehr.style.marginTop = "10px";
        mehr.textContent = "Weitere " +
          (Math.min(TAB_MEHR, a.monate.length) - TAB_WENIG) + " Monate";
        mehr.addEventListener("click", function () {
          tabelleMehr = true;
          tabelleZeichnen(a);
        });
        tabelleEl.appendChild(mehr);
      }
    }

    zeichnen();
    return { neuZeichnen: zeichnen };
  }

  /* --- Sparkline (ohne Bibliothek, damit die Startseite immer traegt) --- */

  function sparkline(ziel, werte, monate) {
    const n = werte.length;
    if (n < 2) return;
    const w = 220, h = 38, pad = 2;
    const min = Math.min.apply(null, werte);
    const max = Math.max.apply(null, werte);
    const spanne = (max - min) || 1;

    const punkte = werte.map(function (v, i) {
      const x = pad + (i / (n - 1)) * (w - 2 * pad);
      const y = h - pad - ((v - min) / spanne) * (h - 2 * pad);
      return [x, y];
    });

    const d = punkte.map(function (p, i) {
      return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
    }).join(" ");
    const letzte = punkte[n - 1];

    ziel.innerHTML =
      '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" role="img" ' +
      'aria-label="Verlauf ' + escape(monatKurz(monate[0])) + " bis " +
      escape(monatKurz(monate[n - 1])) + '">' +
      '<path d="' + d + '" fill="none" stroke="' + css("--series-1") +
      '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>' +
      '<circle cx="' + letzte[0].toFixed(1) + '" cy="' + letzte[1].toFixed(1) +
      '" r="2.6" fill="' + css("--series-1") + '" stroke="' + css("--surface") + '" stroke-width="2"/>' +
      "</svg>";
  }

  /* --- Kopf- und Fusszeile --------------------------------------------- */

  const SEITEN = [
    ["index.html", "Übersicht"],
    ["geschaeftsklima.html", "Geschäftsklima"],
    ["beschaeftigungsbarometer.html", "Beschäftigungsbarometer"],
    ["exporterwartungen.html", "Exporterwartungen"],
    ["importklima.html", "Importklima"],
    ["daten.html", "Daten"],
    ["methodik.html", "Methodik"]
  ];

  function rahmenAufbauen() {
    const hier = (location.pathname.split("/").pop() || "index.html");

    document.title = (document.body.dataset.titel ? document.body.dataset.titel + " — " : "") + CFG.name;

    const hinweis = document.createElement("div");
    hinweis.className = "prototyp-hinweis";
    hinweis.textContent = CFG.disclaimer;

    const header = document.createElement("header");
    header.className = "site";
    let nav = "";
    SEITEN.forEach(function (s) {
      nav += '<a href="' + s[0] + '"' + (s[0] === hier ? ' aria-current="page"' : "") + ">" +
             escape(s[1]) + "</a>";
    });
    header.innerHTML = '<div class="wrap"><a class="marke" href="index.html">' + escape(CFG.name) +
      "</a><nav>" + nav + "</nav></div>";

    document.body.insertBefore(header, document.body.firstChild);
    document.body.insertBefore(hinweis, document.body.firstChild);

    // Kompakt: eine Zeile mit dem Noetigen. Der Prototyp-Hinweis steht schon
    // oben im Streifen, hier genuegt die Quelle samt Datenstand und der Weg
    // zur Methodik.
    const footer = document.createElement("footer");
    footer.className = "site";
    footer.innerHTML = '<div class="wrap"><p>' +
      escape(CFG.disclaimer) + " · Quelle: ifo Konjunkturumfragen, Stand " +
      escape(stand()) + " (<a href=\"https://www.ifo.de/umfragen/zeitreihen\">" +
      "ifo.de</a>) · <a href=\"methodik.html\">Methodik</a>" +
      "</p></div>";
    document.body.appendChild(footer);
  }

  /* --- Sprungziel nach dem Aufbau anspringen --------------------------- */

  function ankerAnspringen() {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(function () { el.scrollIntoView({ block: "start" }); }, 60);
  }

  /* --- Heatmap ---------------------------------------------------------- */

  /*
    Bereiche in den Zeilen, Monate in den Spalten. Die Werte sind Salden und
    schwanken um null; die Farbskala ist deshalb divergierend (Blau fuer
    positive, Rot fuer negative Salden, neutrales Grau in der Mitte). Die
    Skala ist symmetrisch um null, damit gleich grosse Abweichungen nach oben
    und unten gleich stark eingefaerbt sind.

    heatmap(ziel, {
      id, titel, serien: [...], zeilen: [Beschriftungen], monate: Anzahl
    })
  */
  function heatmap(ziel, o) {
    const serien = o.serien.filter(Boolean);
    if (!serien.length) return;

    const a = zuschneiden(serien, o.monate || 24);
    const alleWerte = [];
    a.spalten.forEach(function (sp) {
      sp.forEach(function (v) { if (v !== null && v !== undefined) alleWerte.push(v); });
    });
    if (!alleWerte.length) return;

    const grenze = Math.max.apply(null, alleWerte.map(Math.abs)) || 1;

    const block = document.createElement("div");
    block.className = "chart-block sprungziel";
    block.id = o.id;

    const quelle = serien[0].source;
    const werkzeuge = document.createElement("div");
    werkzeuge.className = "werkzeuge";

    const kopf = document.createElement("div");
    kopf.className = "chart-kopf";
    kopf.innerHTML = '<div class="titelblock"><h3>' + escape(o.titel) + "</h3>" +
      '<div class="einheit">' + escape(serien[0].unit) + "</div></div>";
    kopf.appendChild(werkzeuge);
    block.appendChild(kopf);

    let meldeTimer = null;
    const statusEl = document.createElement("span");
    statusEl.className = "kopier-status";
    statusEl.setAttribute("role", "status");
    function melden(t) {
      statusEl.textContent = t;
      clearTimeout(meldeTimer);
      meldeTimer = setTimeout(function () { statusEl.textContent = ""; }, 6000);
    }

    [["Daten (CSV)", function () {
       csvHerunterladen(serien, a, o.titel,
         [o.titel, "Quelle: " + quelle, CFG.disclaimer,
          "Erzeugt am " + new Date().toLocaleDateString("de-DE")]);
     }],
     ["Link", function () { linkKopieren(o.id, melden); }]
    ].forEach(function (k) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn"; b.textContent = k[0];
      b.addEventListener("click", k[1]);
      werkzeuge.appendChild(b);
    });

    // --- Tabelle
    let h = '<div class="heatmap-huelle"><table class="heatmap"><thead><tr><th></th>';
    a.monate.forEach(function (m, i) {
      // Nur jeden zweiten Monat beschriften, sonst wird die Kopfzeile unleserlich.
      h += "<th>" + (i % 2 === 0 ? MONATE_KURZ[+m.slice(5, 7) - 1] +
           (m.slice(5, 7) === "01" ? " " + m.slice(2, 4) : "") : "") + "</th>";
    });
    h += "</tr></thead><tbody>";

    serien.forEach(function (s, k) {
      h += "<tr><th>" + escape(o.zeilen ? o.zeilen[k] : label(s.sector)) + "</th>";
      a.spalten[k].forEach(function (v, i) {
        if (v === null || v === undefined) {
          h += '<td class="leer" title="keine Daten">·</td>';
        } else {
          h += '<td style="background:' + zellfarbe(v, grenze) +
               ";color:" + zellschrift(v, grenze) + '" title="' +
               escape((o.zeilen ? o.zeilen[k] : label(s.sector)) + ", " +
                      monatLang(a.monate[i]) + ": " + zahl(v, 1)) +
               '">' + zahl(v, 0) + "</td>";
        }
      });
      h += "</tr>";
    });
    h += "</tbody></table></div>";

    const huelle = document.createElement("div");
    huelle.innerHTML = h;
    block.appendChild(huelle.firstChild);

    // --- Farbskala als Legende
    const skala = document.createElement("div");
    skala.className = "skala";
    let balken = '<span>' + zahl(-grenze, 0) + "</span><span class=\"balken\">";
    for (let i = -3; i <= 3; i++) balken += '<i style="background:' +
      zellfarbe(i / 3 * grenze, grenze) + '"></i>';
    balken += "</span><span>+" + zahl(grenze, 0) + "</span>";
    skala.innerHTML = balken +
      '<span style="margin-left:10px">negative Salden rot, positive blau</span>';
    block.appendChild(skala);

    const fuss = document.createElement("div");
    fuss.className = "chart-fuss";
    fuss.innerHTML = "<span>" + escape(monatLang(a.monate[0])) + " bis " +
      escape(monatLang(a.monate[a.monate.length - 1])) + " · Quelle: " +
      escape(quelle) + "</span>";
    fuss.appendChild(statusEl);
    block.appendChild(fuss);

    ziel.appendChild(block);
  }

  // Divergierende Skala mit den vier Farben der ifo Heatmap: Blau fuer
  // positive, Rot fuer negative Salden, in der Mitte ein neutraler Ton. Je
  // Richtung zwei Stuetzpunkte, damit die kraeftigen Toene ("Krise",
  // "Boom") am Rand der Skala auch wirklich erreicht werden.
  function zellfarbe(v, grenze) {
    const t = Math.max(-1, Math.min(1, v / grenze));
    const betrag = Math.abs(t);
    if (betrag < 0.04) return css("--div-mid");

    const schwach = t > 0 ? css("--div-pos") : css("--div-neg");
    const stark   = t > 0 ? css("--div-pos-stark") : css("--div-neg-stark");

    // Erste Haelfte: von der Mitte zum hellen Ton. Zweite Haelfte: vom hellen
    // zum kraeftigen Ton.
    if (betrag <= 0.5) {
      return mischen(css("--div-mid"), schwach, 0.3 + 1.4 * betrag);
    }
    return mischen(schwach, stark, (betrag - 0.5) / 0.5);
  }

  // Helle Zellen nahe der Mitte bekommen dunkle Schrift, kraeftige Zellen
  // weisse. Sonst steht in den blassen Feldern Weiss auf fast Weiss. Die
  // Schwelle liegt hinter dem hellen Stuetzpunkt der Skala.
  function zellschrift(v, grenze) {
    const betrag = Math.abs(Math.max(-1, Math.min(1, v / grenze)));
    return betrag < 0.55 ? css("--text-primary") : "#ffffff";
  }

  function mischen(a, b, anteil) {
    const x = hex(a), y = hex(b);
    if (!x || !y) return b;
    const m = [0, 1, 2].map(function (i) {
      return Math.round(x[i] + (y[i] - x[i]) * anteil);
    });
    return "rgb(" + m.join(",") + ")";
  }

  function hex(s) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* --- Export ----------------------------------------------------------- */

  window.APP = {
    serie: serie,
    aktuell: aktuell,
    chartBlock: chartBlock,
    heatmap: heatmap,
    sparkline: sparkline,
    zuschneiden: zuschneiden,
    tabelleHtml: tabelleHtml,
    rahmenAufbauen: rahmenAufbauen,
    ankerAnspringen: ankerAnspringen,
    monatLang: monatLang,
    monatKurz: monatKurz,
    monatZiffern: monatZiffern,
    zahl: zahl,
    zahlMitVorzeichen: zahlMitVorzeichen,
    label: label,
    escape: escape,
    css: css,
    serienfarben: serienfarben,
    csvHerunterladen: csvHerunterladen,
    quelleHtml: quelleHtml,
    stand: stand,
    MONATE_KURZ: MONATE_KURZ
  };
})();
