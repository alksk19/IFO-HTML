/* ---------------------------------------------------------------------------
   dashboard_v2.js — Bausteine des Dashboard-Entwurfs (Dummy-Daten)

   Eigenstaendige Datei fuer dashboard_v2.html. Aendert app.js, config.js und
   styles.css nicht, verwendet aber deren oeffentliche APP-Funktionen und
   CSS-Klassen weiter, damit Technik und Optik gleich bleiben (siehe
   DECISIONS.md / README.md).

   Alles hier gezeichnete beruht auf window.DASHBOARD_DATA und
   window.DASHBOARD_REGISTRY (beide von
   scripts/build_dummy_dashboard.py aus data/dummy/*.csv bzw.
   data/datasets.csv erzeugt) - ausschliesslich Dummy-Werte.

   Buttons, Status-Hinweise, Quellenzeilen und Einheiten kommen aus der
   Registry, nichts ist hier hart codiert.
--------------------------------------------------------------------------- */

window.DASH = (function () {
  "use strict";

  const DATA = window.DASHBOARD_DATA;
  const REG = window.DASHBOARD_REGISTRY || [];
  const REG_BY_ID = {};
  REG.forEach(function (r) { REG_BY_ID[r.id] = r; });

  if (!DATA) { console.error("dashboard_v2_data.js fehlt."); return {}; }

  const STATUS_TEXT = {
    frei: null, // Download-Button statt Text
    ifo_genehmigung: "Veröffentlichung wird mit ifo geklärt",
    kostenpflichtig: "Nur Grafik – Daten nicht zum Download verfügbar",
    platzhalter: "Platzhalter – Datenzugang wird geklärt"
  };

  /* --- Zugriff auf eine Serie eines Dummy-Datensatzes -------------------- */

  function serie(datasetId, seriesName, sector) {
    const liste = DATA.datasets[datasetId];
    if (!liste || !Array.isArray(liste)) return null;
    const s = liste.find(function (x) {
      return x.series === seriesName && (sector === undefined || x.sector === sector);
    });
    return s || null;
  }

  function querschnitt(datasetId) {
    const d = DATA.datasets[datasetId];
    return (d && d.typ === "B") ? d : null;
  }

  /* --- Zeitraeume (wie app.js, eigenstaendig) ---------------------------- */

  const ZEITRAEUME = [
    { id: "2j", text: "2 J.", monate: 24 },
    { id: "10j", text: "10 J.", monate: 120 },
    { id: "alle", text: "Alle", monate: null }
  ];

  function zuschneiden(serien, monate) {
    return APP.zuschneiden(serien, monate);
  }

  /* --- Dummy-Vermerk --------------------------------------------------- */

  const DUMMY_HINWEIS = "Entwurf mit Dummy-Daten — keine echten Werte";

  /* --- PNG-Export mit Dummy-Vermerk (eigenstaendig, siehe app.js:bildCanvas) */

  function pngMitVermerk(chart, titel, quelle) {
    const src = chart.canvas;
    const skala = window.devicePixelRatio > 1 ? 2 : 1;
    const rand = 16 * skala, kopfH = 34 * skala, fussH = 48 * skala;

    const out = document.createElement("canvas");
    out.width = src.width + rand * 2;
    out.height = src.height + kopfH + fussH;
    const g = out.getContext("2d");

    g.fillStyle = APP.css("--surface") || "#fff";
    g.fillRect(0, 0, out.width, out.height);

    g.fillStyle = APP.css("--text-primary") || "#000";
    g.font = "600 " + (14 * skala) + "px Inter, sans-serif";
    g.textBaseline = "middle";
    g.fillText(titel, rand, kopfH / 2 + 2 * skala);

    g.drawImage(src, rand, kopfH);

    g.fillStyle = APP.css("--text-muted") || "#777";
    g.font = (11 * skala) + "px Inter, sans-serif";
    g.fillText("Quelle: " + quelle, rand, out.height - fussH / 2 - 14 * skala);
    g.fillStyle = "#b00000";
    g.font = "600 " + (11 * skala) + "px Inter, sans-serif";
    g.fillText(DUMMY_HINWEIS, rand, out.height - fussH / 2 + 2 * skala);
    g.fillStyle = APP.css("--text-muted") || "#777";
    g.font = (11 * skala) + "px Inter, sans-serif";
    g.fillText("Erzeugt am " + new Date().toLocaleDateString("de-DE"), rand,
                out.height - fussH / 2 + 16 * skala);

    out.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = dateiname(titel) + ".png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }, "image/png");
  }

  function dateiname(titel) {
    return titel.toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* --- Status-Hinweis + Werkzeuge aus der Registry ----------------------- */

  function statusHinweisHtml(reg) {
    if (!reg) return "";
    const txt = STATUS_TEXT[reg.status];
    if (!txt) return "";
    return '<p class="hinweis-klein dash-status dash-status-' + reg.status + '">' +
           APP.escape(txt) + "</p>";
  }

  function quelleZeileHtml(reg) {
    if (!reg) return "";
    const text = APP.escape(reg.quelle || "");
    if (!reg.quelle_link) return text;
    return '<a href="' + APP.escape(reg.quelle_link) + '" target="_blank" rel="noopener">' +
           text + "</a>";
  }

  /* --- Zeitreihen-Kachel (Linie) ------------------------------------------

    chartBlock(ziel, {
      id, titel, bedeutung, registryId,
      serien: [{dataset, series, sector}],
      legende, stellen, nullLinie, zeitraum, einheitOverride,
      zielwert: { wert, text }   optionale Ziel-/Referenzlinie (z.B. 2 %)
      info: { text, quelle }     optionaler Methodik-Popover
    })
  --------------------------------------------------------------------------- */

  function chartBlock(ziel, o) {
    const reg = REG_BY_ID[o.registryId || o.id];
    const serien = o.serien.map(function (s) { return serie(s.dataset, s.series, s.sector); })
                            .filter(Boolean);

    const block = document.createElement("div");
    block.className = "chart-block sprungziel";
    block.id = o.id;

    const kopf = document.createElement("div");
    kopf.className = "chart-kopf";
    const einheit = o.einheitOverride || (reg ? reg.einheit : (serien[0] && serien[0].unit) || "");
    kopf.innerHTML =
      '<div class="titelblock"><h3><span class="titeltext">' + APP.escape(o.titel) + "</span></h3>" +
      '<div class="einheit">' + APP.escape(einheit) + "</div></div>";
    if (o.info) APP.infoKnopf(kopf.querySelector("h3"), o.info, o.id);

    const werkzeuge = document.createElement("div");
    werkzeuge.className = "werkzeuge";

    let zeitraum = o.zeitraum || "10j";
    const schalter = document.createElement("div");
    schalter.className = "bereich-schalter";
    ZEITRAEUME.forEach(function (z) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (z.id === zeitraum ? " aktiv" : "");
      b.textContent = z.text;
      b.addEventListener("click", function () {
        zeitraum = z.id;
        Array.prototype.forEach.call(schalter.children, function (c, i) {
          c.classList.toggle("aktiv", ZEITRAEUME[i].id === zeitraum);
        });
        zeichnen();
      });
      schalter.appendChild(b);
    });
    werkzeuge.appendChild(schalter);

    const statusEl = document.createElement("span");
    statusEl.className = "kopier-status";
    statusEl.setAttribute("role", "status");
    function melden(t) {
      statusEl.textContent = t;
      setTimeout(function () { statusEl.textContent = ""; }, 6000);
    }

    let chart = null;

    if (reg && reg.status === "frei" && reg.download_erlaubt === "ja") {
      const bCsv = document.createElement("button");
      bCsv.type = "button"; bCsv.className = "btn"; bCsv.textContent = "CSV";
      bCsv.addEventListener("click", function () {
        const a = ausschnitt();
        APP.csvHerunterladen(serien, a, o.titel,
          [o.titel, "Quelle: " + (reg.quelle || ""), DUMMY_HINWEIS,
           "Erzeugt am " + new Date().toLocaleDateString("de-DE")]);
      });
      werkzeuge.appendChild(bCsv);

      const bPng = document.createElement("button");
      bPng.type = "button"; bPng.className = "btn"; bPng.textContent = "PNG";
      bPng.addEventListener("click", function () {
        if (chart) pngMitVermerk(chart, o.titel, reg.quelle || "");
      });
      werkzeuge.appendChild(bPng);
    } else {
      const bPng = document.createElement("button");
      bPng.type = "button"; bPng.className = "btn"; bPng.textContent = "PNG";
      bPng.addEventListener("click", function () {
        if (chart) pngMitVermerk(chart, o.titel, (reg && reg.quelle) || "");
      });
      werkzeuge.appendChild(bPng);
    }

    const bLink = document.createElement("button");
    bLink.type = "button"; bLink.className = "btn"; bLink.textContent = "Link";
    bLink.addEventListener("click", function () {
      const url = location.href.split("#")[0] + "#" + o.id;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { melden("Link kopiert"); });
      }
      history.replaceState(null, "", "#" + o.id);
    });
    werkzeuge.appendChild(bLink);

    kopf.appendChild(werkzeuge);
    block.appendChild(kopf);

    if (o.bedeutung) {
      const p = document.createElement("p");
      p.className = "dash-bedeutung";
      p.textContent = o.bedeutung;
      block.appendChild(p);
    }

    if (serien.length > 1) {
      const farben = APP.serienfarben();
      const leg = document.createElement("div");
      leg.className = "legende";
      serien.forEach(function (s, i) {
        const sp = document.createElement("span");
        const ic = document.createElement("i");
        ic.style.background = farben[i % farben.length];
        sp.appendChild(ic);
        sp.appendChild(document.createTextNode(o.legende ? o.legende[i] : s.series));
        leg.appendChild(sp);
      });
      block.appendChild(leg);
    }

    const flaeche = document.createElement("div");
    flaeche.className = "chart-flaeche";
    const canvas = document.createElement("canvas");
    flaeche.appendChild(canvas);
    block.appendChild(flaeche);

    const fuss = document.createElement("div");
    fuss.className = "chart-fuss";
    const spanne = document.createElement("span");
    fuss.appendChild(spanne);
    fuss.appendChild(statusEl);
    block.appendChild(fuss);

    const quelleP = document.createElement("p");
    quelleP.className = "hinweis-klein";
    quelleP.style.marginTop = "6px";
    quelleP.innerHTML = "Quelle: " + quelleZeileHtml(reg);
    block.appendChild(quelleP);
    block.insertAdjacentHTML("beforeend", statusHinweisHtml(reg));

    ziel.appendChild(block);

    function ausschnitt() {
      const z = ZEITRAEUME.find(function (x) { return x.id === zeitraum; });
      return zuschneiden(serien, z ? z.monate : null);
    }

    function zeichnen() {
      if (!serien.length) {
        flaeche.innerHTML = '<p class="hinweis-klein">Keine Dummy-Daten vorhanden.</p>';
        return;
      }
      const a = ausschnitt();
      if (chart) { chart.destroy(); chart = null; }
      if (typeof window.Chart === "undefined") {
        flaeche.innerHTML = '<p class="hinweis-klein">Diagrammbibliothek nicht geladen.</p>';
        return;
      }
      const farben = APP.serienfarben();
      const datasets = serien.map(function (s, i) {
        return {
          label: o.legende ? o.legende[i] : s.series,
          data: a.spalten[i],
          borderColor: farben[i % farben.length],
          backgroundColor: farben[i % farben.length],
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
          pointHitRadius: 14, tension: 0.15, spanGaps: false
        };
      });
      const plugins = [];
      if (o.zielwert) {
        plugins.push({
          id: "zielwert-" + o.id,
          afterDatasetsDraw: function (c) {
            const y = c.scales.y;
            if (!y) return;
            const py = y.getPixelForValue(o.zielwert.wert);
            const g = c.ctx;
            g.save();
            g.strokeStyle = APP.css("--text-muted");
            g.setLineDash([4, 4]);
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(c.chartArea.left, py);
            g.lineTo(c.chartArea.right, py);
            g.stroke();
            g.restore();
          }
        });
      }
      if (o.nullLinie) {
        plugins.push({
          id: "nulllinie-" + o.id,
          beforeDatasetsDraw: function (c) {
            const y = c.scales.y;
            if (!y || y.min > 0 || y.max < 0) return;
            const py = y.getPixelForValue(0);
            const g = c.ctx;
            g.save(); g.strokeStyle = APP.css("--axis"); g.lineWidth = 1;
            g.beginPath(); g.moveTo(c.chartArea.left, py); g.lineTo(c.chartArea.right, py);
            g.stroke(); g.restore();
          }
        });
      }
      chart = new window.Chart(canvas, {
        type: "line",
        data: { labels: a.monate.map(APP.monatKurz), datasets: datasets },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: APP.css("--text-primary"),
              titleColor: APP.css("--surface"), bodyColor: APP.css("--surface"),
              callbacks: {
                title: function (items) { return APP.monatLang(a.monate[items[0].dataIndex]); },
                label: function (item) {
                  return item.dataset.label + ": " + APP.zahl(item.parsed.y, o.stellen);
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: APP.css("--text-muted"), font: { size: 11 }, maxTicksLimit: 9 } },
            y: { grid: { color: APP.css("--grid") }, ticks: { color: APP.css("--text-muted"), font: { size: 11 }, callback: function (v) { return APP.zahl(v, 0); } } }
          }
        },
        plugins: plugins
      });
      if (a.monate.length) {
        spanne.textContent = APP.monatLang(a.monate[0]) + " bis " +
          APP.monatLang(a.monate[a.monate.length - 1]) + " · " + a.monate.length + " Monate";
      }
    }

    zeichnen();
    return { neuZeichnen: zeichnen };
  }

  /* --- Balken-Kachel fuer Bundesland-Querschnitte (Karten-Ersatz) -------- */

  function barBlock(ziel, o) {
    const reg = REG_BY_ID[o.registryId || o.id];
    const q = querschnitt(o.dataset);
    const block = document.createElement("div");
    block.className = "chart-block sprungziel";
    block.id = o.id;

    const kopf = document.createElement("div");
    kopf.className = "chart-kopf";
    kopf.innerHTML = '<div class="titelblock"><h3><span class="titeltext">' +
      APP.escape(o.titel) + "</span></h3><div class=\"einheit\">" +
      APP.escape((q && q.unit) || "") + "</div></div>";
    block.appendChild(kopf);

    if (o.bedeutung) {
      const p = document.createElement("p");
      p.className = "dash-bedeutung";
      p.textContent = o.bedeutung;
      block.appendChild(p);
    }

    if (o.kartenHinweis) {
      const hw = document.createElement("p");
      hw.className = "hinweis-klein";
      hw.textContent = o.kartenHinweis;
      block.appendChild(hw);
    }

    const flaeche = document.createElement("div");
    flaeche.className = "chart-flaeche";
    const canvas = document.createElement("canvas");
    flaeche.appendChild(canvas);
    block.appendChild(flaeche);

    const quelleP = document.createElement("p");
    quelleP.className = "hinweis-klein";
    quelleP.style.marginTop = "6px";
    quelleP.innerHTML = "Quelle: " + quelleZeileHtml(reg);
    block.appendChild(quelleP);
    block.insertAdjacentHTML("beforeend", statusHinweisHtml(reg));

    ziel.appendChild(block);

    if (!q || typeof window.Chart === "undefined") {
      flaeche.innerHTML = '<p class="hinweis-klein">Keine Dummy-Daten vorhanden.</p>';
      return;
    }

    const zeilen = q.zeilen.slice().sort(function (a, b) { return b.value - a.value; });
    const farben = APP.serienfarben();
    new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: zeilen.map(function (z) { return z.bundesland; }),
        datasets: [{
          data: zeilen.map(function (z) { return z.value; }),
          backgroundColor: farben[0]
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: APP.css("--text-muted"), font: { size: 11 } }, grid: { color: APP.css("--grid") } },
          y: { ticks: { color: APP.css("--text-muted"), font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  /* --- Quadranten-Streudiagramm (ifo Konjunkturuhr) ----------------------- */

  function quadrantBlock(ziel, o) {
    const reg = REG_BY_ID[o.registryId || o.id];
    const lage = serie(o.dataset, o.lage);
    const erw = serie(o.dataset, o.erwartungen);

    const block = document.createElement("div");
    block.className = "chart-block sprungziel";
    block.id = o.id;

    const kopf = document.createElement("div");
    kopf.className = "chart-kopf";
    kopf.innerHTML = '<div class="titelblock"><h3><span class="titeltext">' +
      APP.escape(o.titel) + "</span></h3><div class=\"einheit\">" +
      APP.escape((lage && lage.unit) || "") + "</div></div>";
    if (o.info) APP.infoKnopf(kopf.querySelector("h3"), o.info, o.id);
    block.appendChild(kopf);

    if (o.bedeutung) {
      const p = document.createElement("p");
      p.className = "dash-bedeutung";
      p.textContent = o.bedeutung;
      block.appendChild(p);
    }

    const flaeche = document.createElement("div");
    flaeche.className = "chart-flaeche";
    const canvas = document.createElement("canvas");
    flaeche.appendChild(canvas);
    block.appendChild(flaeche);

    const quelleP = document.createElement("p");
    quelleP.className = "hinweis-klein";
    quelleP.style.marginTop = "6px";
    quelleP.innerHTML = "Quelle: " + quelleZeileHtml(reg);
    block.appendChild(quelleP);
    block.insertAdjacentHTML("beforeend", statusHinweisHtml(reg));

    ziel.appendChild(block);

    if (!lage || !erw || typeof window.Chart === "undefined") {
      flaeche.innerHTML = '<p class="hinweis-klein">Keine Dummy-Daten vorhanden.</p>';
      return;
    }

    const letzte = 36; // 3 Jahre Punktwolke
    const n = lage.values.length;
    const von = Math.max(0, n - letzte);
    const punkte = [];
    for (let i = von; i < n; i++) {
      punkte.push({ x: erw.values[i], y: lage.values[i] });
    }
    const farben = APP.serienfarben();

    new window.Chart(canvas, {
      type: "scatter",
      data: {
        datasets: [{
          data: punkte, backgroundColor: farben[0],
          pointRadius: function (ctx) { return ctx.dataIndex === punkte.length - 1 ? 6 : 3; }
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (item) {
                return "Erwartungen " + APP.zahl(item.parsed.x, 1) +
                       " · Lage " + APP.zahl(item.parsed.y, 1);
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: "Geschäftserwartungen", color: APP.css("--text-muted") }, grid: { color: APP.css("--grid") } },
          y: { title: { display: true, text: "Geschäftslage", color: APP.css("--text-muted") }, grid: { color: APP.css("--grid") } }
        }
      },
      plugins: [{
        id: "achsen-" + o.id,
        beforeDatasetsDraw: function (c) {
          const xa = c.scales.x, ya = c.scales.y;
          const g = c.ctx;
          g.save(); g.strokeStyle = APP.css("--axis"); g.lineWidth = 1;
          if (xa.min < 0 && xa.max > 0) {
            const px = xa.getPixelForValue(0);
            g.beginPath(); g.moveTo(px, c.chartArea.top); g.lineTo(px, c.chartArea.bottom); g.stroke();
          }
          if (ya.min < 0 && ya.max > 0) {
            const py = ya.getPixelForValue(0);
            g.beginPath(); g.moveTo(c.chartArea.left, py); g.lineTo(c.chartArea.right, py); g.stroke();
          }
          g.restore();
        }
      }]
    });
  }

  /* --- Kennzahl-Kachel (Kopfbereich) -------------------------------------- */

  function kachel(ziel, o) {
    const reg = REG_BY_ID[o.registryId || o.id];
    const s = serie(o.dataset, o.series, o.sector);
    const a = s ? APP.aktuell(s) : null;

    const kachelEl = document.createElement("div");
    kachelEl.className = "tile dash-tile";

    if (!a) {
      kachelEl.innerHTML = '<div class="tile-titel">' + APP.escape(o.titel) + "</div>" +
        '<p class="hinweis-klein">Keine Daten vorhanden.</p>';
      ziel.appendChild(kachelEl);
      return;
    }

    let klasse = "null", pfeil = "±";
    if (a.delta > 0) { klasse = "auf"; pfeil = "▲"; }
    else if (a.delta < 0) { klasse = "ab"; pfeil = "▼"; }

    const stellen = o.stellen === undefined ? 1 : o.stellen;

    kachelEl.innerHTML =
      '<div class="tile-titel">' + APP.escape(o.titel) + "</div>" +
      '<div class="wert">' + APP.zahl(a.wert, stellen) + "</div>" +
      '<div class="einheit">' + APP.escape(o.einheitKurz || "") + "</div>" +
      '<div class="delta ' + klasse + '">' + pfeil + " " +
        APP.zahlMitVorzeichen(a.delta, stellen) + " zum Vormonat</div>" +
      '<div class="sparkline"></div>' +
      '<div class="stand">Stand: ' + APP.monatLang(a.monat) + " (Dummy)</div>";

    ziel.appendChild(kachelEl);

    const fenster = 120;
    const von = Math.max(0, s.values.length - fenster);
    APP.sparkline(kachelEl.querySelector(".sparkline"), s.values.slice(von), s.dates.slice(von));

    if (reg) {
      const statusTxt = STATUS_TEXT[reg.status];
      if (statusTxt) {
        kachelEl.insertAdjacentHTML("beforeend",
          '<p class="hinweis-klein dash-status dash-status-' + reg.status + '">' +
          APP.escape(statusTxt) + "</p>");
      }
    }
  }

  return {
    chartBlock: chartBlock,
    barBlock: barBlock,
    quadrantBlock: quadrantBlock,
    kachel: kachel,
    serie: serie,
    querschnitt: querschnitt,
    registry: function (id) { return REG_BY_ID[id]; },
    registryAlle: REG,
    DUMMY_HINWEIS: DUMMY_HINWEIS,
    STATUS_TEXT: STATUS_TEXT
  };
})();
