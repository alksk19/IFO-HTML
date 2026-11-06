# Konjunkturindikatoren (Prototyp)

Eine statische Website, die die monatlichen Konjunkturindikatoren des ifo
Instituts zugänglich macht — mit den Zahlen hinter jedem Diagramm direkt zum
Herunterladen.

> **Prototyp, keine offizielle Veröffentlichung des ifo Instituts.**
> Diese Seite ist ein nicht offizieller Entwurf und wird vom ifo Institut
> weder herausgegeben noch geprüft.

## Was es ist

Vier Indikatoren, je eine Seite:

| Seite | Inhalt | Zeitraum |
|---|---|---|
| Geschäftsklima | Index und Salden für Deutschland, sieben Wirtschaftsbereiche, Geschäftsunsicherheit, Konjunkturampel, Heatmap | ab 01/1991 bzw. 01/2005 |
| Exporterwartungen | Salden im Verarbeitenden Gewerbe | ab 01/1991 |
| Importklima | Frühindikator für die deutschen Importe | ab 01/1995 |
| Beschäftigungsbarometer | Index und vier Wirtschaftsbereiche | ab 01/2002 |

Dazu eine Startseite mit vier Kacheln, eine **Datenseite** mit allen Tabellen
und eine Methodikseite.

Jedes Diagramm hat denselben Werkzeugsatz: **Daten**, **CSV**, **PNG**,
**Bild kopieren**, **Link**, dazu einen Zeitraumschalter (2 Jahre, 10 Jahre,
alles). Die Werkzeuge treten erst hervor, wenn man sich mit dem Diagramm
befasst — bei Mauszeiger darüber, bei Tastaturfokus oder nach einem Tipp; auf
Tastgeräten sind sie immer sichtbar. „Daten" führt auf die Datenseite, und
zwar an den Abschnitt genau dieser Reihe. Die CSV enthält den Ausschnitt, der
gerade im Diagramm zu sehen ist; auf der Datenseite die vollständige Reihe.

## Website öffnen

Die Seite braucht keinen Server und keinen Build-Schritt:

```
site/index.html im Browser öffnen
```

Ein Doppelklick auf die Datei genügt. Die Daten liegen als JavaScript in
`site/data.js` und werden per `<script>` eingebunden, nicht per `fetch()` —
deshalb funktioniert die Seite auch direkt von der Festplatte (`file://`).
Für GitHub Pages ist sie ebenso geeignet: dort wird `site/` als Quelle
eingestellt.

Die Diagrammbibliothek (Chart.js) wird über ein CDN geladen und braucht
eine Internetverbindung. Ohne Verbindung bleiben Tabellen, CSV-Downloads
und die Sparklines der Startseite vollständig nutzbar; an der Stelle des
Diagramms erscheint ein Hinweis.

## Daten erneuern

Eine einzige Datei muss laufen:

```bash
cd ~/Desktop/ifo-konjunktur-prototyp && Rscript R/build_data.R
```

Das Skript liest die Excel-Dateien aus `data/raw/`, schreibt die
aufbereiteten Reihen nach `data/clean/` und erneuert `site/data.js`. Danach
ist die Website auf dem neuen Stand; an den HTML-Dateien ist nichts zu
ändern.

Das Arbeitsverzeichnis spielt dabei keine Rolle: das Skript sucht die
Projektwurzel (den Ordner mit `data/raw/`) selbst. Es läuft daher auch, wenn
es in RStudio aus `R/` heraus mit *Source* bzw. *Run* gestartet wird.

Benötigt werden R und die Pakete `readxl`, `dplyr`, `tidyr`, `jsonlite`:

```r
install.packages(c("readxl", "dplyr", "tidyr", "jsonlite"))
```

### Neuen Datenstand einspielen

1. Die neuen Excel-Dateien von
   [ifo.de/umfragen/zeitreihen](https://www.ifo.de/umfragen/zeitreihen)
   herunterladen und nach `data/raw/` legen.
   Die Dateinamen tragen den Datenstand (etwa `gsk-d-202610.xlsx`) und
   bleiben unverändert; die alten Dateien können liegen bleiben.
2. `Rscript R/build_data.R` ausführen. Das Skript nimmt je Reihe von selbst
   die **neueste** vorhandene Datei — im Skript ist nichts anzupassen. Es
   prüft dabei, ob je Monat genau ein Wert vorliegt und ob die Monatsfolge
   lückenlos ist, und bricht bei doppelten oder unlesbaren Datumsangaben ab.
3. Fertig. Der Datenstand steht danach in `site/data.js` und wird von der
   Website selbst angezeigt; in `site/config.js` ist nichts zu ändern.

Ändert das ifo Institut den Aufbau der Excel-Dateien (zusätzliche Spalten,
verschobene Kopfzeilen), müssen die Spaltenzuordnungen in `R/build_data.R`
nachgezogen werden; sie sind dort je Datei kommentiert.

## Seite umbenennen

Der Name steht an genau einer Stelle: in `site/config.js`, Feld `name`.
Links oben in der Ecke steht nicht der Name, sondern der Herausgeber —
Feld `marke` im selben Objekt („ifo Institut“).
Eine Änderung dort wirkt auf Kopfzeile, Fußzeile und Seitentitel aller
Seiten. Im selben Objekt steht auch der Prototyp-Hinweis (`disclaimer`).
Das Feld `stand` dort ist nur noch ein Notnagel: angezeigt wird der
Datenstand aus `site/data.js`, den das R-Skript setzt.

## Texte ändern

Alle sichtbaren Wörter stehen im HTML der jeweiligen Seite, nicht im
JavaScript. Wer eine Formulierung ändern will, öffnet also die Datei der
Seite und sucht den Satz dort — ohne Programmierkenntnisse.

| Was | Wo |
|---|---|
| Überschrift und Einleitung einer Seite | `site/<seite>.html`, oben im `<main>`-Teil |
| Wortwahl des erzeugten Vorspanns | ebenda, im Aufruf `APP.lage({...})` am Fuß der Seite |
| Zwischenüberschriften und die Absätze darunter | ebenda, als `<h2>` und `<p class="intro">` |
| Fußnoten unter den Diagrammen | ebenda, Felder `hinweis:` und `langHinweis:` |
| Beschriftung der Aufklapp-Schicht „Mehr Details" | ebenda, im `<details>`-Element |
| Seitenname und Prototyp-Hinweis | `site/config.js` |
| Kacheltexte der Startseite | `site/config.js`, Feld `themen` |
| Methodiktexte | `site/methodik.html` |

Nach dem Speichern genügt ein Neuladen im Browser; die Daten müssen dafür
nicht neu erzeugt werden.

## Aufbau des Projekts

```
.
├── README.md              diese Datei
├── DATA.md                Quellen, Einheiten, Eigenheiten, offene Fragen
├── DECISIONS.md           Protokoll der Entwurfsentscheidungen
├── data/
│   ├── raw/               Rohdaten, unverändert wie heruntergeladen
│   └── clean/             aufbereitete Reihen als CSV
├── .github/workflows/
│   └── daten-aktualisieren.yml  monatlicher Lauf bei GitHub
├── R/
│   ├── build_data.R       die gesamte Datenpipeline
│   └── update_data.R      holt neue Rohdaten von ifo.de
└── site/
    ├── index.html         Startseite mit vier Kacheln
    ├── geschaeftsklima.html          ausgebaute Themenseite
    ├── exporterwartungen.html        |
    ├── importklima.html              | aus der Vorlage seite.js
    ├── beschaeftigungsbarometer.html |
    ├── daten.html         alle Tabellen, je zwölf Monate
    ├── methodik.html      Saldo, Index, Quellen
    ├── config.js          Name, Hinweis, Themen, Quellenlinks
    ├── data.js            erzeugt — nicht von Hand bearbeiten
    ├── app.js             Chart-Baustein, Export, Tabellen, Heatmap
    ├── seite.js           Vorlage der drei einfacheren Seiten
    └── styles.css
```

`site/data.js` wird vom R-Skript geschrieben und bei jedem Lauf
überschrieben; Änderungen daran gehen verloren.

## Daten als CSV

Die Dateien in `data/clean/` liegen im Langformat mit den Spalten
`date`, `series`, `sector`, `value`, `unit`, `source`. Sie verwenden Komma
als Feldtrennzeichen und Dezimalpunkt, sind also für die Weiterverarbeitung
in R oder Python gedacht.

Die aus der Website heruntergeladenen CSV-Dateien enthalten dieselben
Spalten, verwenden aber Semikolon als Feldtrennzeichen und Dezimalkomma und
tragen ein BOM — so öffnet ein deutschsprachiges Excel sie per Doppelklick
ohne Importdialog und mit korrekten Umlauten. Ihnen sind vier Kommentarzeilen
vorangestellt, die Titel, Quelle, Prototyp-Hinweis und Erzeugungsdatum
nennen.

`data/clean/series_meta.csv` listet zu jeder der 39 Reihen Anfang, Ende,
Anzahl der Monatswerte und etwaige Lücken.

## Automatische Aktualisierung

Im Repository liegt ein Arbeitsablauf
(`.github/workflows/daten-aktualisieren.yml`), der die Daten ohne Zutun
erneuern kann:

1. `R/update_data.R` liest [ifo.de/ifo-zeitreihen](https://www.ifo.de/ifo-zeitreihen),
   sucht dort die Links auf die Excel-Dateien und lädt die herunter, die noch
   nicht in `data/raw/` liegen. Vorhandene Dateien werden nie überschrieben;
   ein neuer Stand kommt als zusätzliche Datei dazu.
2. `R/build_data.R` nimmt je Reihe automatisch die **neueste** vorhandene
   Datei und schreibt `data/clean/` und `site/data.js` neu. Der Datenstand
   steht danach in `site/data.js` — in `site/config.js` muss nichts geändert
   werden.
3. Gibt es Änderungen, committet und pusht der Ablauf sie selbst.

Er läuft vom 23. bis 28. jedes Monats um 07:30 UTC, weil das ifo Institut
gegen Monatsende veröffentlicht, und lässt sich im Reiter *Actions* von Hand
starten. Ohne neue Dateien endet er ohne Änderung.

Dasselbe von Hand auf dem eigenen Rechner:

```bash
cd ~/Desktop/ifo-konjunktur-prototyp && Rscript R/update_data.R && Rscript R/build_data.R
```

Nicht automatisiert ist die **Pressemitteilung**: Deren Methodenkästen sind
die Grundlage der Erklärtexte und müssen bei inhaltlichen Änderungen von Hand
geprüft werden.

## GitHub Pages

Die Seite wird vom Arbeitsablauf `.github/workflows/seite-veroeffentlichen.yml`
aus dem Ordner `site/` bereitgestellt, nach jedem Push auf `main`, der die
Seite betrifft, und auf Knopfdruck im Reiter *Actions*.

Adresse: `https://alksk19.github.io/IFO-HTML/`

**Warum ein Arbeitsablauf und nicht die Einstellung?** Unter
*Settings → Pages* lässt die Quelle „Deploy from a branch“ nur den
Projektstamm oder `/docs` zu — einen eigenen Ordner wie `site/` gibt es dort
nicht zur Auswahl. Der Arbeitsablauf nimmt dagegen genau diesen Ordner, ohne
dass das Projekt umgebaut werden muss. Er schaltet Pages beim ersten Lauf
selbst ein (`enablement: true`); in den Einstellungen ist nichts von Hand zu
wählen.

Alle Pfade in den Seiten sind relativ und in der Schreibweise geprüft —
GitHub Pages unterscheidet, anders als macOS, Groß- und Kleinschreibung. Die
leere Datei `.nojekyll` im Projektstamm stammt noch aus dem Weg über den
Branch; bei der Bereitstellung über den Arbeitsablauf läuft Jekyll ohnehin
nicht.

Abschalten lässt sich das unter *Settings → Pages* über *Unpublish site*.

## Einheiten

Maßgeblich sind die Angaben des ifo Instituts auf der Seite der Zeitreihen
([ifo.de/umfragen/zeitreihen](https://www.ifo.de/umfragen/zeitreihen),
Abschnitt „Inhalt“); für das Beschäftigungsbarometer zusätzlich die Tabelle
„nach Wirtschaftsbereich“ der Pressemitteilung.

| Reihe | Einheit |
|---|---|
| ifo Geschäftsklima, Deutschland | Indexwerte (2015=100, saisonbereinigt) und Salden (saisonbereinigt), je für Geschäftsklima, Geschäftsbeurteilung, Geschäftserwartungen |
| Wirtschaftsbereiche (Verarbeitendes Gewerbe, Dienstleistungssektor, Handel, Bauhauptgewerbe; dazu Groß-, Einzelhandel, Gewerbliche Wirtschaft) | Salden (saisonbereinigt) |
| ifo Beschäftigungsbarometer, Deutschland | Indexwerte (2015=100, saisonbereinigt) |
| ifo Beschäftigungsbarometer, Wirtschaftsbereiche | Salden (saisonbereinigt) |
| ifo Exporterwartungen | Salden (saisonbereinigt) |
| ifo Geschäftsunsicherheit | Ursprungswerte als Saldo, nicht saisonbereinigt |
| ifo Konjunkturampel | Wahrscheinlichkeit für eine expansive Entwicklung in % |
| ifo Importklima | Indexwerte, saisonbereinigt |

Diese Schreibweise erscheint unter jedem Diagramm- und Tabellentitel. Die
Zuordnung von der Angabe der Quelldatei auf die angezeigte Schreibweise steht
in `site/config.js` unter `einheiten`; die Spalte `unit` der CSV-Dateien
trägt die Angabe der Quelldatei.

## Begriffe

Durchgängig verwendet werden **Geschäftsklima**, **Geschäftsbeurteilung** und
**Geschäftserwartungen** — in Diagrammlegenden, Tabellenköpfen und in der
Spalte `series` der CSV-Dateien. Kurzformen wie „Klima“, „Lage“ oder
„Erwartungen“ kommen nicht vor. Die Zuordnung steht in `site/config.js` unter
`labels`; eine Änderung dort wirkt auf alle Seiten und alle CSV-Downloads.

## Grenzen dieses Prototyps

- Es sind **keine eigenen Berechnungen** enthalten. Angezeigt werden allein
  die veröffentlichten Werte; umgerechnet wurde nur das Datumsformat.
- Die ifo **Konjunkturuhr** ist bewusst nicht enthalten.
- Die Heatmap zeigt **Salden**, nicht die vier Konjunkturphasen der
  offiziellen ifo-Heatmap (siehe `DECISIONS.md`).

Bei Zitaten in Veröffentlichungen ist das ifo Institut als Quelle zu
nennen, nicht diese Seite.
