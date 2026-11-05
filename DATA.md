# DATA.md — Quellen, Einheiten, Eigenheiten, offene Fragen

Datenstand: **Oktober 2026** (Importklima: September 2026).
Alle Rohdateien liegen unverändert in `data/raw/`.

## Quellen

Die vier Excel-Dateien stammen von
[ifo.de/umfragen/zeitreihen](https://www.ifo.de/umfragen/zeitreihen), die
Pressemitteilung von der Website des ifo Instituts.

| Datei | Inhalt | Reihen |
|---|---|---|
| `gsk-d-202610.xlsx` | ifo Geschäftsklima Deutschland (Blatt 1) und Wirtschaftsbereiche (Blatt 2) | 32 |
| `export-d-202610.xlsx` | ifo Exporterwartungen | 1 |
| `empl-d-202610.xlsx` | ifo Beschäftigungsbarometer | 5 |
| `imklima-d-202609.xlsx` | ifo Importklima | 1 |
| `ku-2026-10-pm-geschaeftsklima-DE.pdf` | Pressemitteilung vom 26.10.2026, Grundlage der Methodiktexte | — |

Quellenangabe in den Daten (Spalte `source`):
„ifo Konjunkturumfragen, Oktober 2026 (ifo Institut)“, beim Importklima
„ifo Importklima, September 2026 (ifo Institut)“.

Für das Importklima nennt die Quelldatei zusätzlich zwei Veröffentlichungen:

- Grimme, C., Lehmann, R. und M. Nöller (2018): Das ifo Importklima — ein
  erster Frühindikator für die Prognose der deutschen Importe, *ifo
  Schnelldienst* 71(12), S. 27–32.
- Grimme, C., Lehmann, R. und M. Nöller (2021): Forecasting Imports with
  Information from Abroad, *Economic Modelling* 98, S. 109–117.

## Aufbau der Quelldateien

Alle Dateien haben einen mehrzeiligen Kopf, der die Einheit und die
Spaltenbezeichnung auf mehrere Zeilen verteilt. Die Zeile, ab der die Daten
beginnen, ist je Datei fest in `R/build_data.R` hinterlegt.

### gsk-d-202610.xlsx, Blatt 1 „ifo Geschäftsklima Deutschland“
Kopf Zeilen 1–9, Daten ab Zeile 10, **262 Zeilen, 01/2005 bis 10/2026**.
Datum als **Text** in der Form `MM/JJJJ`.

| Spalte | Inhalt | Einheit laut Datei |
|---|---|---|
| 1 | Monat/Jahr | — |
| 2–4 | Klima, Lage, Erwartungen | Indexwerte, 2015 = 100, saisonbereinigt |
| 5–7 | Klima, Lage, Erwartungen | Salden, saisonbereinigt |
| 8 | ifo Geschäftsunsicherheit | Ursprungswerte ab 04/2019 |
| 9 | ifo Konjunkturampel | Wahrscheinlichkeit für eine expansive Entwicklung in % |

### gsk-d-202610.xlsx, Blatt 2 „Wirtschaftsbereiche“
Kopf Zeilen 1–9, Daten ab Zeile 10, **430 Zeilen, 01/1991 bis 10/2026**.
Datum als Text `MM/JJJJ`. Je Bereich drei Spalten in der Reihenfolge Klima,
Lage, Erwartungen.

| Spalten | Bereich | Einheit |
|---|---|---|
| 2–4 | Gewerbliche Wirtschaft | Indexwerte, 2015 = 100, saisonbereinigt |
| 5–7 | Gewerbliche Wirtschaft | Salden, saisonbereinigt |
| 8–10 | Verarbeitendes Gewerbe | Salden |
| 11–13 | Dienstleistungssektor | Salden |
| 14–16 | Handel | Salden |
| 17–19 | Großhandel | Salden |
| 20–22 | Einzelhandel | Salden |
| 23–25 | Bauhauptgewerbe | Salden |

„Gewerbliche Wirtschaft“ liegt als einziger Bereich doppelt vor, als Index
und als Saldo. Laut Kopfzeile umfasst sie das Verarbeitende Gewerbe, den
Handel und das Bauhauptgewerbe — also **nicht** den Dienstleistungssektor.

### export-d-202610.xlsx
Kopf Zeilen 1–9, Daten ab Zeile 10, **432 Zeilen**, Datum als **echte
Excel-Datumsspalte**. Einheit: Salden, saisonbereinigt. Reihe
Verarbeitendes Gewerbe.

### empl-d-202610.xlsx
Kopf Zeilen 1–9, Daten ab Zeile 10, **298 Zeilen, 01/2002 bis 10/2026**,
echte Datumsspalte. Spalte 2 Gesamtreihe, Spalten 3–6 Verarbeitendes
Gewerbe, Bauhauptgewerbe, Handel, Dienstleistungssektor.

### imklima-d-202609.xlsx
Blatt `de`, Kopf Zeilen **1–10**, Daten ab Zeile **11** (eine Zeile mehr als
bei den übrigen Dateien), **381 Zeilen, 01/1995 bis 09/2026**, echte
Datumsspalte. Eine Datenspalte mit der Überschrift `R1`.

## Eigenheiten

### Zwei verschiedene Datumsformate
`gsk-d-202610.xlsx` schreibt das Datum als Text `MM/JJJJ`, die drei übrigen
Dateien als echte Excel-Datumswerte. Beide werden auf `JJJJ-MM`
vereinheitlicht.

Beim Einlesen mit `readxl` ist zu beachten: Werden die Kopfzeilen
übersprungen, liefert `readxl` für die Datumsspalten bereits `POSIXct` und
**keine** Seriennummern. Eine Umrechnung über `as.Date(x, origin =
"1899-12-30")` wäre dann falsch und ergäbe Jahreszahlen im Millionenbereich.
`to_month()` in `R/build_data.R` behandelt deshalb beide Fälle.

### Beschäftigungsbarometer: Veröffentlichungstage statt Monatsenden
Die Datumswerte sind in den frühen Jahren Monatsenden (31.01.2002), in den
späteren Jahren die tatsächlichen Veröffentlichungstage (17.07.2026,
25.08.2026, 24.09.2026, 26.10.2026). Sie werden auf den jeweiligen Monat
zurückgeführt. Das ist unkritisch: 298 Zeilen ergeben 298 verschiedene
Monate, es fällt also nichts zusammen und es entsteht keine Lücke.

### Exporterwartungen: zwei leere Zeilen am Ende
Die Datei enthält Zeilen für 11/2026 und 12/2026 ohne Werte. Sie werden
abgeschnitten; der letzte Datenpunkt ist 10/2026.

### Unterschiedliche Startzeitpunkte
| Reihe | beginnt |
|---|---|
| Wirtschaftsbereiche außer Dienstleistungen, Exporterwartungen | 01/1991 |
| Importklima | 01/1995 |
| Beschäftigungsbarometer | 01/2002 |
| Geschäftsklima Deutschland, Dienstleistungssektor | 01/2005 |
| Geschäftsunsicherheit | 04/2019 |

Der Dienstleistungssektor ist in Blatt 2 für 01/1991 bis 12/2004 leer
(168 fehlende Werte), die Geschäftsunsicherheit in Blatt 1 für 01/2005 bis
03/2019 (171 fehlende Werte). Beides sind keine Lücken innerhalb der Reihe,
sondern spätere Startzeitpunkte.

### Keine Lücken
Innerhalb jeder der 39 Reihen liegt für jeden Monat zwischen Anfang und
Ende genau ein Wert vor. `data/clean/series_meta.csv` hält das in der
Spalte `gaps` fest; sie ist derzeit für alle Reihen leer.

### Letzter Monat des Importklimas
Das Importklima endet im September 2026 und damit einen Monat früher als
die übrigen Reihen. Beim Vergleich von Ständen über mehrere Indikatoren ist
das zu beachten.

## Offene Fragen

Nichts davon wurde durch eigene Annahmen ersetzt; die Bezeichnungen der
Quelldateien sind unverändert übernommen und auf der Website gekennzeichnet.

### 1. Einheit des Importklimas
Die Quelldatei bezeichnet die Spalte `R1` in Zeile 8 als „ifo Importklima
(Indexwerte, saisonbereinigt)“. Die Werte liegen jedoch zwischen **−3,093
und 1,353** und schwanken um null. Ein auf 2015 = 100 normierter Index wie
beim Geschäftsklima ist das nicht.

*Zu klären:* Welche Einheit hat die Reihe tatsächlich — standardisierte
Werte, Wachstumsbeiträge, etwas anderes? Wie ist ein Wert von etwa −0,24 zu
interpretieren? In den Daten steht als Einheit:
`Indexwerte, saisonbereinigt (Bezeichnung aus der Quelldatei, siehe DATA.md)`.

### 2. Einheit der Bereichsspalten des Beschäftigungsbarometers
Die Kopfzeile 7 weist als Einheit nur „Indexwerte, 2015 = 100,
saisonbereinigt“ aus. Diese Angabe passt zur Gesamtreihe (Werte um 95), aber
nicht zu den vier Bereichsspalten (Werte wie −45,4 oder −23,7), die klar
Salden nahelegen. Eine eigene Einheitenangabe für die Bereichsspalten
enthält die Datei nicht.

*Zu klären:* Sind die vier Bereichsspalten Salden? In den Daten steht als
Einheit bewusst:
`Einheit in der Quelldatei nicht ausgewiesen (siehe DATA.md)`.

### 3. Definition der Konjunkturampel
Die Pressemitteilung vom Oktober 2026 enthält Methodenkästen zum
Geschäftsklima, zur Konjunkturuhr, zur Geschäftsunsicherheit und zur
Heatmap — **nicht** zur Konjunkturampel. Die einzige vorhandene Beschreibung
ist die Spaltenüberschrift der Excel-Datei: „Wahrscheinlichkeit für eine
expansive Entwicklung in %“.

*Zu klären:* Wie wird die Wahrscheinlichkeit geschätzt, und worauf bezieht
sich „expansive Entwicklung“ — auf das Quartalswachstum des BIP, auf die
Industrieproduktion, auf etwas anderes?

### 4. Transformation zwischen Saldo und Index
Die Pressemitteilung nennt das Geschäftsklima einen „transformierten
Mittelwert“ aus den beiden Salden, ohne die Transformation anzugeben. Index-
und Saldenreihe lassen sich deshalb nicht ineinander umrechnen. Auf der
Website werden sie getrennt ausgewiesen und nicht vermischt.

### 5. Gewerbliche Wirtschaft gegenüber Deutschland
Blatt 2 führt „Gewerbliche Wirtschaft“ (Verarbeitendes Gewerbe, Handel,
Bauhauptgewerbe) als eigene Abgrenzung, während Blatt 1 „Deutschland“
ausweist, das laut Pressemitteilung zusätzlich den Dienstleistungssektor
umfasst. Die beiden Abgrenzungen sind nicht identisch und werden auf der
Website getrennt gehalten: „Gewerbliche Wirtschaft“ erscheint nur in der
Schicht „Mehr Details“ der Geschäftsklima-Seite.

*Zu klären:* Ab wann enthält die Reihe „Deutschland“ den
Dienstleistungssektor? Der Dienstleistungssektor wird erst ab 01/2005
erhoben, und genau dann beginnt auch die Deutschland-Reihe — ein
Zusammenhang liegt nahe, ist aus den Dateien aber nicht belegt.

## Aufbereitete Daten

`data/clean/` enthält fünf Dateien im Langformat plus `series_meta.csv`.

| Datei | Reihen | Zeilen |
|---|---|---|
| `gsk_deutschland.csv` | 8 | 1.925 |
| `gsk_bereiche.csv` | 24 | 9.816 |
| `export.csv` | 1 | 430 |
| `empl.csv` | 5 | 1.490 |
| `imklima.csv` | 1 | 381 |

Spalten: `date` (`JJJJ-MM`), `series`, `sector`, `value`, `unit`, `source`.

Die Seriennamen tragen keine Umlaute (`Geschaeftsklima`, `Grosshandel`),
damit sie in Dateinamen und als Schlüssel unproblematisch sind. Die
lesbaren Bezeichnungen stehen in `site/config.js` unter `labels`. Salden
tragen das Suffix `_saldo`; Reihen ohne Suffix sind Indexwerte.
