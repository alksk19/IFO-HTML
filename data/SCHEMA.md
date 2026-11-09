# SCHEMA.md — Spaltenschema der Dummy- und späteren Echtdaten-CSVs

Gilt für die Grafiken des Dashboard-Entwurfs (`site/dashboard_v2.html`).
Betrifft nicht die vier bestehenden ifo-Seiten (`geschaeftsklima.html` usw.) —
deren Schema steht weiterhin in `README.md` und `DATA.md`.

Jede Grafik des Dashboards bezieht ihre Daten aus genau einer CSV-Datei,
entweder in `data/dummy/` (erfundene Platzhalterwerte) oder, sobald echte
Zahlen vorliegen, in `data/real/` (tatsächliche Werte aus der jeweils in
`data/datasets.csv` genannten Quelle). Welcher Ordner gilt, steht in der
Spalte `csv_datei` der Registry (`real/<id>.csv` bzw. `<id>.csv` ohne
Präfix für `data/dummy/`). `scripts/build_dummy_dashboard.py` übernimmt
jede Datei aus `data/real/`, deren Name (ohne Endung) einer Registry-`id`
entspricht, automatisch anstelle der erfundenen Reihe — die zugehörige
`data/dummy/<id>.csv` wird dann nicht mehr erzeugt. Beim Umstieg auf echte
Daten wird also die passende CSV-Datei einfach nach `data/real/` gelegt;
an `site/dashboard_v2.html` ändert sich nichts, sofern Spaltennamen und
Schreibweise erhalten bleiben.

Es gibt zwei Schema-Typen:

## Typ A — Zeitreihe (die meisten Grafiken)

Langformat, eine Zeile je Monat und Teilserie. Identisch mit dem Schema von
`data/clean/*.csv` (siehe `README.md`), damit beide Datenwege zusammenpassen.

| Spalte | Inhalt | Beispiel |
|---|---|---|
| `date` | Monat, `JJJJ-MM` | `2026-10` |
| `series` | Name der Reihe, ohne Umlaute | `Privater_Konsum` |
| `sector` | Untergliederung (Wirtschaftsbereich, Altersgruppe, Gütergruppe, Land …); leer, wenn es nur eine Gesamtreihe gibt | `Bundesland_Bayern` |
| `value` | Zahlenwert, Dezimalpunkt | `1.4` |
| `unit` | Einheit, wörtlich wie in der Quelle | `Veränderung ggü. Vorjahresquartal in %` |
| `source` | Quellenangabe, wie sie unter dem Diagramm erscheinen soll | `Statistisches Bundesamt (Destatis), Genesis-Online` |

Trennzeichen Komma, Dezimalpunkt — zur Weiterverarbeitung in R/Python, wie
`data/clean/`. Für den Download aus dem Browser (sofern laut Registry
erlaubt) wandelt die Website das wie gewohnt in Semikolon/Dezimalkomma/BOM
um.

## Typ B — Querschnitt je Bundesland (Karten und Ranglisten)

Eine Zeile je Bundesland, ein Stand (kein Zeitverlauf). Für die
Mietindex-Karte, die Mietbelastungsquote und vergleichbare Länder-Rankings.

| Spalte | Inhalt | Beispiel |
|---|---|---|
| `bundesland` | Name des Bundeslands, amtliche Schreibweise | `Nordrhein-Westfalen` |
| `value` | Zahlenwert, Dezimalpunkt | `7.8` |
| `unit` | Einheit | `Index (2020=100)` |
| `stand` | Berichtszeitraum | `2026-Q2` |
| `source` | Quellenangabe | `Statistisches Bundesamt (Destatis), Genesis-Online` |

Die Kartengrundlage (Geometrien der 16 Bundesländer) ist ein eigener
Registry-Eintrag (`geodaten_bundeslaender`) mit eigener Lizenz, keine
Zahlenreihe — siehe `data/datasets.csv`.

## Gemeinsame Regeln

- Seriennamen ohne Umlaute (wie im bestehenden Prototyp), lesbare
  Bezeichnungen kommen aus einer Labels-Tabelle, nicht aus der CSV selbst.
- Fehlende Monate/Länder bleiben einfach aus der Datei weg, keine leeren
  Werte.
- Jede CSV trägt in `data/datasets.csv` genau eine Zeile mit `csv_datei` als
  Dateiname; das Dashboard liest Titel, Einheit, Quelle, Lizenz-Hinweis und
  Download-Berechtigung ausschließlich aus dieser Registry.
