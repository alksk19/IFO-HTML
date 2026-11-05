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
Blau für positive, Rot für negative Werte, neutrales Grau in der Mitte. Die
Skalengrenze ist der größte Betrag im dargestellten Ausschnitt, damit
Abweichungen nach oben und unten gleich stark eingefärbt sind.

**Höchstens drei Serien je Diagramm.** Klima, Lage und Erwartungen sind
genau drei. Beim Vergleich der vier Bereiche des Beschäftigungsbarometers
werden deshalb zwei Diagramme erzeugt statt eines mit vier Linien.
Begründung: Die verwendete Farbpalette ist für bis zu drei gleichzeitig
sichtbare Serien auf Unterscheidbarkeit geprüft, auch bei Farbfehlsicht.

**Legende ab zwei Serien, Nulllinie bei Salden hervorgehoben.** Die
Zuordnung darf nicht allein an der Farbe hängen; die Nulllinie trägt bei
Salden die eigentliche Aussage.

**Tabelle auf 13 Monate begrenzt, CSV auf den vollen Ausschnitt.** Die
Tabelle unter jedem Diagramm zeigt die letzten 13 Monate — dieselbe Spanne
wie die Tabellen der Pressemitteilung und auf einen Blick lesbar. Der
CSV-Download umfasst dagegen den gesamten im Diagramm dargestellten
Zeitraum. Der Hinweistext über der Tabelle sagt beides.

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
- **Keine automatische Aktualisierung.** Ein neuer Datenstand erfordert die
  neuen Excel-Dateien und einen Lauf des R-Skripts; der Weg ist im
  `README.md` beschrieben.
