# Offene Lücken im Prototyp

Stand: 05.11.2026 · Seite: https://alksk19.github.io/IFO-HTML/

Diese Liste ist zum Weiterleiten gedacht. Sie nennt alles, was am Prototyp
noch fehlt, unklar ist oder ins Leere führt — nach Art der Lücke sortiert,
nicht nach Aufwand. Nichts davon ist bisher durch eigene Annahmen
überbrückt worden.

---

## 1. Inhaltliche Fragen an das Haus

Diese fünf stehen ausführlich in `DATA.md` und sind aus den Quelldateien
allein nicht zu beantworten.

| # | Frage | Wo sichtbar |
|---|---|---|
| 1 | **Einheit des Importklimas.** Die Quelldatei sagt „Indexwerte, saisonbereinigt“, die Werte liegen aber zwischen −3,09 und 1,35 und schwanken um null — kein Index wie beim Geschäftsklima. Wie ist ein Wert von −0,24 zu lesen? | Importklima-Seite, Hinweis unter der Einleitung |
| 2 | **Einheit der vier Bereichsspalten des Beschäftigungsbarometers.** Die Datei weist nur für die Gesamtreihe eine Einheit aus. Die Bereichswerte (−45,4, −23,7) legen Salden nahe, stehen aber nirgends als solche. | Beschäftigungsbarometer-Seite, Abschnitt Wirtschaftsbereiche |
| 3 | **Definition der Konjunkturampel.** Die Pressemitteilung hat Methodenkästen zu Geschäftsklima, Konjunkturuhr, Geschäftsunsicherheit und Heatmap — aber keinen zur Ampel. Einzige Beschreibung ist die Spaltenüberschrift „Wahrscheinlichkeit für eine expansive Entwicklung in %“. Wahrscheinlichkeit wofür genau — BIP-Quartalswachstum, Industrieproduktion? | Geschäftsklima-Seite, „Mehr Details“ |
| 4 | **Transformation zwischen Saldo und Index.** Die Pressemitteilung nennt das Klima einen „transformierten Mittelwert“, ohne die Transformation anzugeben. Beide Reihen werden deshalb getrennt gezeigt und nie ineinander umgerechnet. | Methodikseite |
| 5 | **Ab wann enthält „Deutschland“ den Dienstleistungssektor?** Die Deutschland-Reihe beginnt 01/2005, genau wie die Dienstleistungserhebung. Der Zusammenhang liegt nahe, ist aber nicht belegt. | Methodikseite, `DATA.md` |

## 2. Texte, die noch niemand geschrieben hat

- **Vorspann nur auf der Geschäftsklima-Seite.** Dort steht jetzt ein
  automatisch aus den Daten erzeugter Vorspann im Aufbau der
  ifo-Veröffentlichungen („ifo Geschäftsklimaindex gestiegen (Oktober
  2026)“ + vier Sätze). Beschäftigungsbarometer, Exporterwartungen und
  Importklima haben so etwas noch nicht — technisch wäre es dieselbe
  Funktion, es fehlen nur die Formulierungen je Indikator.
- **Die Deutung am Ende fehlt bewusst.** Das ifo Institut schließt seine
  Texte mit einem Satz wie „Die Konjunkturbelebung setzt sich fort“. Der
  folgt nicht aus den Zahlen und wird deshalb nicht erzeugt. Wenn er auf
  die Seite soll, muss ihn jemand monatlich schreiben.
- **Keine Einordnung der Werte.** Nirgends steht, was ein Klimawert von
  90,2 historisch bedeutet (Rezessionsschwelle, langjähriger Mittelwert).
- **Kein Hinweis auf den nächsten Veröffentlichungstermin.** Das ifo nennt
  ihn auf jeder Umfrageseite (nächster: 24.11.2026).

## 3. Knöpfe, die ins Leere führen

Der Knopf **„Daten“** springt zur Datenseite, zum Abschnitt genau dieser
Reihe. Für acht Diagramme gibt es diesen Abschnitt nicht — der Sprung
landet dann oben auf der Datenseite statt an der Tabelle. Betroffen sind
ausschließlich die langen Reihen in den Aufklapp-Schichten „Mehr Details“:

| Seite | Diagramm | fehlender Abschnitt |
|---|---|---|
| Geschäftsklima | Klima, lange Reihe | `chart-klima-lang` |
| Geschäftsklima | Gewerbliche Wirtschaft, lange Reihe | `chart-gewerbliche-lang` |
| Beschäftigungsbarometer | lange Reihe | `chart-empl-lang` |
| Beschäftigungsbarometer | Bereiche 1 und 2 | `chart-empl-bereiche-1`, `-2` |
| Exporterwartungen | lange Reihe | `chart-export-lang` |
| Importklima | lange Reihe | `chart-importklima-lang` |

Inhaltlich sind das dieselben Reihen wie in den kurzen Diagrammen. Die
saubere Lösung ist, diese Diagramme auf den vorhandenen Abschnitt zeigen
zu lassen, statt auf der Datenseite acht weitere Tabellen anzulegen.

## 4. Daten, die es beim ifo gibt und hier nicht

Vom Angebot auf [ifo.de/ifo-zeitreihen](https://www.ifo.de/ifo-zeitreihen)
sind enthalten: Geschäftsklima Deutschland und Bereiche, Exporterwartungen,
Beschäftigungsbarometer, Importklima. Nicht enthalten:

- ifo Geschäftsklima **Ostdeutschland** und **Sachsen** (beide monatlich,
  XLSX, gleiches Format — wären mit wenig Aufwand aufzunehmen)
- ifo **Weltwirtschaftsklima** und ifo **Wirtschaftsklima für den Euroraum**
- **Historische Zeitreihen Westdeutschland 1960–1990**
- **Vintage-Datensatz** (alle ursprünglich veröffentlichten Stände seit
  2005, acht Dateien) — interessant für die Frage, wie stark revidiert wird
- **ifo Streuungsmaß**: auf der ifo-Seite als Inhalt der Geschäftsklima-Datei
  genannt, in unserer Datei steht an dieser Stelle die
  Geschäftsunsicherheit. Zu prüfen, ob das dasselbe ist.

## 5. Bewusst nicht enthalten (keine Lücke, nur zur Klarstellung)

- Die **ifo Konjunkturuhr** — siehe `DECISIONS.md`.
- Die **offizielle ifo-Heatmap** mit den vier Konjunkturphasen. Die Heatmap
  hier zeigt Salden, nicht Phasen; das steht auch so auf der Seite.
- **Eigene Berechnungen** jeder Art. Umgerechnet wurde nur das Datumsformat.

## 6. Technisch offen

- **Letzter Stand ungleich.** Das Importklima endet im September 2026, alle
  übrigen Reihen im Oktober. Auf der Startseite stehen dadurch zwei
  verschiedene Stände nebeneinander.
- **Diagramme brauchen Internet.** Chart.js kommt von einem CDN. Ohne
  Verbindung bleiben Tabellen, CSV und Startseite nutzbar, an der Stelle
  des Diagramms steht ein Hinweis.
- **Nicht auf Barrierefreiheit geprüft.** Kontraste, Tastaturbedienung und
  Screenreader sind nicht systematisch getestet. Die ifo-Dateien selbst
  sind als „nicht barrierefrei“ gekennzeichnet.
- **Schmale Fenster und Handy nicht abschließend geprüft.** Die Seite ist
  dafür gebaut, der Durchgang steht aber noch aus.
- **Kein Gesamtdownload.** CSV gibt es je Reihe, nicht als ein Paket über
  alle 39 Reihen.
- **Nur deutsch.** Keine englische Fassung.
- **Pressemitteilung nicht automatisiert.** Ihre Methodenkästen sind die
  Grundlage der Erklärtexte und müssen bei inhaltlichen Änderungen von
  Hand geprüft werden.
- **Das ZIP in `freigabe/` wird nur auf Zuruf neu gepackt.** Es ist keine
  automatische Ausgabe und läuft dem Stand der Website hinterher, sobald
  sich an `site/` etwas ändert. Stand des aktuellen Pakets: 06.11.2026,
  entspricht dem Commit `87cbf76`.

## 7. Noch festzulegen

- **Seitenname.** Heißt jetzt „Konjunkturindikatoren“, links oben steht
  „ifo Institut“. Falls das Haus eine andere Bezeichnung will, ist das eine
  Zeile in `site/config.js`.
- **Wie offen die Seite sein soll.** Sie ist über GitHub Pages öffentlich
  erreichbar. Der Prototyp-Hinweis steht über jeder Seite; abschalten lässt
  sich die Veröffentlichung unter *Settings → Pages → Unpublish site*.
