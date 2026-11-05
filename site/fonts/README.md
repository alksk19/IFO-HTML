# site/fonts

`Inter-latin.woff2` — Inter v20, Variable Font (Gewichte 100–900 in einer
Datei), Latin-Subset, 47 KB.

Bezogen am 05.11.2026 von Google Fonts (`fonts.gstatic.com`). Inter steht unter
der SIL Open Font License 1.1; das Mitliefern im Projekt ist damit erlaubt.

Die Datei liegt bewusst lokal und nicht als CDN-Einbindung: so funktioniert die
Schrift auch offline und beim Öffnen von `index.html` direkt von der Festplatte
(`file://`). Eingebunden wird sie über die `@font-face`-Regel am Anfang von
`../styles.css`; derselbe Stack steht als `SCHRIFT` in `../app.js`, damit
Sparklines und PNG-Export dieselbe Schrift verwenden wie die Seite.

Hintergrund: ifo.de setzt „ifoInter", also ebenfalls Inter.
