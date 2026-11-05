# DECISIONS.md — Entwurfsentscheidungen

Kurzes Protokoll der Entscheidungen, die beim Bau dieses Prototyps
getroffen wurden, jeweils mit Begründung. Datum: 04./05.11.2026.

## Daten

**Keine eigenen Berechnungen.** Angezeigt werden allein die
veröffentlichten Werte. Verändert wurde nur die Form der Datumsangaben
(`MM/JJJJ` beziehungsweise Excel-Datumswerte → `JJJJ-MM`). Begründung: Der
Mehrwert der Seite liegt im Zugang zu den Zahlen, nicht in deren
Interpretation; jede eigene Rechnung müsste gegen die offiziellen Zahlen
verteidigt werden.

**Einheiten werden wörtlich übernommen, auch wenn sie unplausibel wirken.**
Beim Importklima bleibt es bei „Indexwerte, saisonbereinigt“, obwohl die
Werte um null schwanken; die Bereichsspalten des Beschäftigungsbarometers
werden nicht als Salden deklariert, obwohl die Werte das nahelegen.
Stattdessen ist der Vorbehalt Teil der Einheitenangabe selbst, steht auf der
jeweiligen Themenseite und in `DATA.md`. Begründung: Eine geratene Einheit
wäre in den heruntergeladenen CSV-Dateien nicht mehr als Vermutung zu
erkennen.

**Seriennamen ohne Umlaute, Anzeigenamen getrennt.** In den Daten stehen
`Geschaeftsklima` und `Grosshandel`, die lesbaren Bezeichnungen in
`site/config.js` unter `labels`. Begründung: Die Seriennamen gehen in
Dateinamen und Objektschlüssel ein.

**Salden tragen das Suffix `_saldo`, Indexreihen keines.** Für
Geschäftsklima, Lage und Erwartungen existieren beide Einheiten; ohne
Unterscheidung im Namen wären sie nicht eindeutig adressierbar.

**Alle 39 Reihen werden aufbereitet, auch die nicht angezeigten.**
`gsk_bereiche.csv` enthält Groß- und Einzelhandel sowie die Gewerbliche
Wirtschaft, die in der Pressemitteilung nicht vorkommen. Begründung: Die
Pipeline kostet dasselbe, und die Daten stehen für spätere Erweiterungen
bereit.

## Darstellung

**Heatmap mit Salden statt Konjunkturphasen.** Die offizielle ifo-Heatmap
zeigt die vier Phasen der Konjunkturuhr (Krise, Erholung, Boom, Abkühlung).
Hier werden stattdessen die Salden selbst eingefärbt — so wie beauftragt und
passend dazu, dass die Konjunkturuhr bewusst nicht enthalten ist. Die
Phasenvariante ließe sich aus Lage und Erwartungen gegenüber ihren
Mittelwerten nachbilden, wäre dann aber eine eigene Berechnung und keine
veröffentlichte Zahl mehr.

**Divergierende Farbskala, symmetrisch um null.** Salden sind
Vorzeichengrößen; eine einfarbige Skala würde die Nulllinie verwischen.
Blau für positive, Rot für negative Werte, neutraler Ton in der Mitte. Die
Skalengrenze ist der größte Betrag im dargestellten Ausschnitt, damit
Abweichungen nach oben und unten gleich stark eingefärbt sind.

**Farben exakt aus den ifo-Veröffentlichungen.** Die Werte stammen nicht aus
einer eigenen Palette, sondern wurden den Diagrammen der Pressemitteilung
`data/raw/ku-2026-10-pm-geschaeftsklima-DE.pdf` entnommen (Vektorgrafiken,
Farbwerte direkt aus der Datei ausgelesen, 05.11.2026). Gegenprobe: die
Textfarbe des PDF ist `#414650` — exakt die Lauftextfarbe von ifo.de.

- Liniendiagramme (Seiten 1–2): Geschäftsklima `#3237de`, Geschäftslage
  `#fa4600`, Geschäftserwartungen `#00be64`; Raster `#b9bec8`, Achsen
  `#72737e`.
- Heatmap (Seite 4): „Krise" `#bb3300`, „Abkühlung" `#ff8d62`, „Erholung"
  `#8385eb`, „Boom" `#3237de`.

Wichtig dabei: In der ifo-Heatmap stehen diese vier Farben für **Kategorien**
— die vier Konjunkturphasen. Hier werden sie als **Stützpunkte einer
stufenlosen Saldenskala** verwendet: `#bb3300` am negativen Ende, `#ff8d62`
schwach negativ, neutral in der Mitte, `#8385eb` schwach positiv, `#3237de`
am positiven Ende. Die Farben sind also dieselben, ihre Bedeutung ist eine
andere. Rot für negativ und Blau für positiv entspricht dabei der ifo-Logik.

**Höchstens drei Serien je Diagramm.** Klima, Lage und Erwartungen sind
genau drei. Beim Vergleich der vier Bereiche des Beschäftigungsbarometers
werden deshalb zwei Diagramme erzeugt statt eines mit vier Linien.
Begründung: Die verwendete Farbpalette ist für bis zu drei gleichzeitig
sichtbare Serien auf Unterscheidbarkeit geprüft, auch bei Farbfehlsicht.

**Legende ab zwei Serien, Nulllinie bei Salden hervorgehoben.** Die
Zuordnung darf nicht allein an der Farbe hängen; die Nulllinie trägt bei
Salden die eigentliche Aussage.

**Tabellen begrenzt, CSV auf den vollen Ausschnitt.** Eine Tabelle zeigt die
letzten zwölf Monate und ist damit auf einen Blick lesbar. Der CSV-Download
umfasst den gesamten im Diagramm dargestellten Zeitraum, auf der Datenseite
die vollständige Reihe. Der Hinweistext über der Tabelle sagt beides.

**Gestaltung am tatsächlichen ifo-Auftritt statt an einer eigenen Idee.**
Flächen, Textfarben, Größenstaffel und Akzentfarbe sind von ifo.de übernommen
(ausgelesene Computed Styles, 05.11.2026): Seitengrund `#f4f5fa`,
Inhaltsflächen weiß, Überschriften `#141414` in 700, Lauftext `#414650`
16px/22px, Akzent `#3237de`. Dazu die Eigenheiten des Auftritts: rechte Winkel
statt abgerundeter Karten, Flächen ohne Rahmen, gepunktete Trennlinien, Links
fett und blau mit gepunkteter Unterkante. Bewusst nicht verwendet werden
Verläufe, Schatten, Icons vor Überschriften, Pillen-Badges und zentrierte
Slogan-Köpfe. Begründung: Einfach **und** vertraut aussehende Seiten machen den
besten ersten Eindruck (Tuch et al. 2012); die Seite soll nach
Wirtschaftsforschungsinstitut aussehen, nicht nach Vorlage.

**Eine Tabelle je Seite, alle übrigen auf einer Datenseite.** Auf der
Themenseite steht genau eine Tabelle, neben dem Hauptdiagramm. Jedes weitere
Diagramm verweist über „Daten" auf `site/daten.html`, wo je Reihe ein
Abschnitt mit Anker liegt. Begründung: geringe visuelle Komplexität je
Bildschirm; wer Zahlen braucht, findet sie gesammelt an einem Ort.

**Werkzeuge erscheinen erst bei Befassung.** Die Knöpfe sind standardmäßig
unsichtbar und erscheinen bei Mauszeiger darüber, bei Tastaturfokus oder nach
einem Tipp. Auf Geräten ohne Hover bleiben sie sichtbar, sonst wären sie nicht
auffindbar. Der Platz wird immer freigehalten, damit beim Einblenden nichts
springt.

**Genau eine Link-Funktion je Diagramm.** Früher war zusätzlich die
Quellenangabe unter dem Diagramm verlinkt. Die Angabe bleibt als Text
(Attribution ist Pflicht), der Hyperlink zur ifo-Seite steht nur noch auf der
Datenseite und der Methodikseite.

**Tabellen nach dem EU Data Visualisation Guide.** Höchstbreite statt voller
Seitenbreite, Zahlen rechtsbündig und in Dunkelgrau, Spaltenköpfe wie ihre
Daten ausgerichtet, Monatsspalte links, eine Nachkommastelle mit deutschem
Komma, echtes Minuszeichen (U+2212) statt Bindestrich, Ziffern gleicher
Breite, nur leichte Zeilentrenner, keine Zebrastreifen. Blau bleibt dem Akzent
vorbehalten, damit der Textkontrast mindestens 4,5:1 erreicht (WCAG AA).

**Lange Zeitreihen hinter „Mehr Details“.** Die Seiten sollen für den
schnellen Blick funktionieren; die Reihen ab 1991 stehen eine Ebene
tiefer. Die Diagramme dort werden erst beim Öffnen aufgebaut.

**Sparklines als handgeschriebenes SVG.** Die Startseite kommt damit ohne
die Diagrammbibliothek aus und funktioniert auch ohne Internetverbindung.

## Technik

**Daten als `window.SITE_DATA` in `site/data.js`, kein `fetch()`.** Ein
Browser verweigert `fetch()` auf lokale Dateien; die Seite muss sich aber
per Doppelklick aus dem Dateisystem öffnen lassen. Ein `<script>`-Tag
unterliegt dieser Beschränkung nicht. Nebeneffekt: Die Seite ist ohne
Änderung auch auf GitHub Pages lauffähig.

**Chart.js 4.4.1 über CDN.** Beherrscht PNG-Export aus dem Canvas, ist
klein und braucht keinen Build-Schritt. Preis: eine Internetverbindung.
Fällt sie aus, erscheint an der Stelle des Diagramms ein Hinweis, während
Tabellen und CSV-Downloads weiter funktionieren. Soll die Seite vollständig
offline laufen, ist die Datei nach `site/` zu legen und der CDN-Verweis in
den fünf HTML-Dateien zu ersetzen.

**Kein Build-Schritt, kein Paketmanager.** Fünf HTML-Dateien, vier
JavaScript-Dateien, ein Stylesheet. Begründung: Ein Prototyp, der in zwei
Jahren noch läuft, ist mehr wert als einer mit aktueller Werkzeugkette.

**Ein gemeinsamer Chart-Baustein in `app.js`.** Jedes Diagramm der Seite
entsteht aus demselben Aufruf und bekommt dadurch zwangsläufig dieselbe
Werkzeugleiste, denselben Zeitraumschalter und dieselbe Tabelle. Die drei
einfacheren Seiten teilen sich darüber hinaus die Vorlage `seite.js` und
enthalten nur noch Text und einen Aufruf.

**Die Geschäftsklima-Seite nutzt `seite.js` bewusst nicht.** Sie ist der
ausgebaute Pilot mit Kennzahlen, Bereichsabschnitt, Unsicherheitsreihe und
Heatmap. Diese Sonderfälle in die Vorlage zu zwingen, hätte beide Seiten
unübersichtlich gemacht.

**Seitenname nur in `site/config.js`.** `SITE.name` wirkt auf Kopfzeile,
Fußzeile und Seitentitel. Der Arbeitstitel „Konjunktur-Daten Prototyp“ ist
ein Platzhalter und mit einer Zeile zu ersetzen.

**Prototyp-Hinweis an drei Stellen.** Als gelbes Band über jeder Seite, im
Fußtext und in jedem exportierten Bild und jeder CSV-Datei. Begründung: Ein
weitergegebenes Diagramm verliert sonst den Zusammenhang, aus dem hervorgeht,
dass es sich nicht um eine Veröffentlichung des ifo Instituts handelt.

**CSV-Downloads mit Semikolon, Dezimalkomma und BOM.** Die Zielgruppe
öffnet die Dateien in einem deutschsprachigen Excel; so geschieht das per
Doppelklick ohne Importdialog und mit korrekten Umlauten. Die Dateien in
`data/clean/` bleiben davon unberührt und verwenden Komma und Dezimalpunkt
für die Weiterverarbeitung in R oder Python.

**Farbpalette maschinell geprüft.** Die drei Serienfarben wurden gegen
Helligkeitsband, Farbsättigung, Unterscheidbarkeit bei Farbfehlsicht und
Kontrast zum Hintergrund geprüft, getrennt für helle und dunkle
Darstellung. Das helle Grün liegt unter 3:1 Kontrast; abgedeckt ist das
durch die Legende und die Tabelle unter jedem Diagramm, in der jeder Wert
auch als Zahl steht.

**Dunkelmodus mit eigenen Farbwerten.** Keine automatische Umkehrung,
sondern je Rolle ein für den dunklen Hintergrund geprüfter Wert.

## Bewusst nicht gemacht

- **Keine Konjunkturuhr** — so beauftragt.
- **Keine Prognosen, keine Fortschreibung**, auch nicht für den im
  Importklima fehlenden Oktober 2026.
- **Kein Vergleich der Indikatoren in einem Diagramm.** Index und Salden
  haben unterschiedliche Maßstäbe; zwei Achsen in einem Diagramm wären
  irreführend.
- ~~**Keine automatische Aktualisierung.**~~ Seit dem 05.11.2026 gibt es sie
  doch: `R/update_data.R` holt die Dateien von ifo.de, `R/build_data.R` nimmt
  je Reihe die neueste, und ein GitHub-Actions-Ablauf führt beides gegen
  Monatsende aus. Rohdateien werden dabei nie überschrieben, ein neuer Stand
  kommt als zusätzliche Datei dazu — der alte bleibt nachvollziehbar. Die
  Pressemitteilung bleibt bewusst außen vor: ihre Methodenkästen sind die
  Grundlage der Erklärtexte und werden von Hand geprüft.

## Pages über einen Arbeitsablauf statt über den Branch (05.11.2026)

Die Seite liegt in `site/`, nicht im Projektstamm und nicht in `docs/`. Die
Einstellung *Settings → Pages → Deploy from a branch* lässt aber nur diese
beiden Orte zu; ein eigener Ordner steht dort nicht zur Auswahl. Zur Wahl
standen: `site/` nach `docs/` umbenennen (dann müssten das R-Skript, alle
Dokumentation und die lokalen Lesezeichen nachziehen) oder die Quelle auf
*GitHub Actions* umstellen. Entschieden für den Arbeitsablauf
`seite-veroeffentlichen.yml`: er lädt genau `site/` hoch, lässt die
Projektstruktur unangetastet und schaltet Pages beim ersten Lauf selbst ein.
Er läuft nur bei Änderungen an `site/`, damit ein reiner Datenlauf nicht
unnötig eine Veröffentlichung auslöst — ändert der Datenlauf `site/data.js`,
greift er dagegen.

Damit ist die frühere Festlegung „Pages vorbereitet, nicht aktiviert"
überholt: die Seite ist auf ausdrücklichen Wunsch öffentlich erreichbar.

## Vorspann aus den Daten statt von Hand geschrieben (05.11.2026)

Die Themenseiten begannen mit einem Platzhalter „Beschreibung“. Auf der
Startseite ist er ersatzlos gestrichen — die vier Kacheln sagen selbst,
worum es geht, und ein Untertitel darüber wäre Füllmaterial.

Auf der Geschäftsklimaseite steht stattdessen ein Vorspann im Aufbau der
ifo-Veröffentlichungen: eine Zeile „ifo Geschäftsklimaindex gestiegen
(Oktober 2026)“, darunter vier Sätze mit dem aktuellen Wert, dem
Vormonatswert und der Richtung von Lage und Erwartungen.

Dieser Text wird bei jedem Seitenaufruf aus `site/data.js` erzeugt
(`app.js`, Funktion `lage`) und ist deshalb nach jedem Datenupdate von
selbst aktuell. Von Hand geschrieben wäre er nach vier Wochen falsch, und
das fällt niemandem auf.

Bewusst **nicht** erzeugt wird die Deutung, die beim ifo Institut am Ende
steht („Die Konjunkturbelebung setzt sich fort“). Sie folgt nicht aus den
Zahlen allein und kann nur von einem Menschen verantwortet werden. Der
Hinweis unter dem Vorspann sagt ausdrücklich, dass es kein Text des ifo
Instituts ist.

## Marke und Seitenname getrennt (05.11.2026)

Links oben steht der Herausgeber („ifo Institut“, `config.js`, Feld
`marke`), der Seitenname ist „Konjunkturindikatoren“ (Feld `name`) und
erscheint im Browser-Titel und in der Fußzeile. Der frühere Name
„Konjunktur-Daten Prototyp“ ist entfallen; dass es ein Prototyp ist, sagt
der schwarze Streifen über jeder Seite deutlicher.
