# Konjunktur-Daten Prototyp

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

Dazu eine Startseite mit vier Kacheln und eine Methodikseite.

Jedes Diagramm hat denselben Werkzeugsatz: **Bild kopieren**, **PNG**,
**Daten (CSV)**, **Link**, dazu einen Zeitraumschalter (2 Jahre, 10 Jahre,
alles). Ein Klick auf das Diagramm springt in den zugehörigen
Datenabschnitt. Die CSV enthält genau den Ausschnitt, der gerade im
Diagramm zu sehen ist.

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

Benötigt werden R und die Pakete `readxl`, `dplyr`, `tidyr`, `jsonlite`:

```r
install.packages(c("readxl", "dplyr", "tidyr", "jsonlite"))
```

### Neuen Datenstand einspielen

1. Die neuen Excel-Dateien von
   [ifo.de/umfragen/zeitreihen](https://www.ifo.de/umfragen/zeitreihen)
   herunterladen und nach `data/raw/` legen.
2. Die Dateinamen in `R/build_data.R` anpassen (die Namen tragen den
   Datenstand, etwa `gsk-d-202610.xlsx`) — die vier Zuweisungen stehen
   direkt am Anfang unter „Pfade“.
3. `Rscript R/build_data.R` ausführen. Das Skript prüft dabei selbst, ob je
   Monat genau ein Wert vorliegt und ob die Monatsfolge lückenlos ist, und
   bricht bei doppelten oder unlesbaren Datumsangaben ab.
4. In `site/config.js` den Eintrag `stand` auf den neuen Monat setzen.

Ändert das ifo Institut den Aufbau der Excel-Dateien (zusätzliche Spalten,
verschobene Kopfzeilen), müssen die Spaltenzuordnungen in `R/build_data.R`
nachgezogen werden; sie sind dort je Datei kommentiert.

## Seite umbenennen

Der Name steht an genau einer Stelle: in `site/config.js`, Feld `name`.
Eine Änderung dort wirkt auf Kopfzeile, Fußzeile und Seitentitel aller
Seiten. Im selben Objekt stehen auch der Prototyp-Hinweis (`disclaimer`)
und der Datenstand (`stand`).

## Aufbau des Projekts

```
.
├── README.md              diese Datei
├── DATA.md                Quellen, Einheiten, Eigenheiten, offene Fragen
├── DECISIONS.md           Protokoll der Entwurfsentscheidungen
├── data/
│   ├── raw/               Rohdaten, unverändert wie heruntergeladen
│   └── clean/             aufbereitete Reihen als CSV
├── R/
│   └── build_data.R       die gesamte Datenpipeline
└── site/
    ├── index.html         Startseite mit vier Kacheln
    ├── geschaeftsklima.html          ausgebaute Themenseite
    ├── exporterwartungen.html        |
    ├── importklima.html              | aus der Vorlage seite.js
    ├── beschaeftigungsbarometer.html |
    ├── methodik.html      Saldo, Index, Quellen
    ├── config.js          Name, Hinweis, Datenstand, Themen
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

## Grenzen dieses Prototyps

- Es sind **keine eigenen Berechnungen** enthalten. Angezeigt werden allein
  die veröffentlichten Werte; umgerechnet wurde nur das Datumsformat.
- Die ifo **Konjunkturuhr** ist bewusst nicht enthalten.
- Die Heatmap zeigt **Salden**, nicht die vier Konjunkturphasen der
  offiziellen ifo-Heatmap (siehe `DECISIONS.md`).
- Drei Angaben sind aus den Quellen nicht eindeutig; sie sind unverändert
  übernommen und auf der Methodikseite sowie in `DATA.md` gekennzeichnet.

Bei Zitaten in Veröffentlichungen ist das ifo Institut als Quelle zu
nennen, nicht diese Seite.
