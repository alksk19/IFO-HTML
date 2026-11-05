// ---------------------------------------------------------------------------
// config.js — zentrale Konfiguration der Website
//
// Der Seitenname steht ausschliesslich hier. Eine Aenderung von SITE.name
// wirkt auf alle Seiten (Kopfzeile, Fusszeile, Seitentitel im Browser).
// ---------------------------------------------------------------------------

window.SITE = {
  // Arbeitstitel. Zum Umbenennen genuegt diese eine Zeile.
  name: "Konjunktur-Daten Prototyp",

  // Hinweis, der auf jeder Seite erscheint.
  disclaimer: "Prototyp, keine offizielle Veröffentlichung des ifo Instituts",

  // Monat des aktuellen Datenstands, wie er in den Quelldateien steht.
  stand: "Oktober 2026",

  // Lesbare Bezeichnungen fuer die Serien- und Bereichsnamen aus data.js.
  // Die Daten tragen aus Kompatibilitaetsgruenden ASCII-Namen; die Anzeige
  // verwendet durchgaengig diese Beschriftungen.
  labels: {
    Geschaeftsklima: "Geschäftsklima",
    Geschaeftslage: "Geschäftslage",
    Geschaeftserwartungen: "Geschäftserwartungen",
    Geschaeftsklima_saldo: "Geschäftsklima",
    Geschaeftslage_saldo: "Geschäftslage",
    Geschaeftserwartungen_saldo: "Geschäftserwartungen",
    Geschaeftsunsicherheit: "ifo Geschäftsunsicherheit",
    Konjunkturampel: "ifo Konjunkturampel",
    Exporterwartungen: "ifo Exporterwartungen",
    Beschaeftigungsbarometer: "ifo Beschäftigungsbarometer",
    Importklima: "ifo Importklima",
    "Gewerbliche Wirtschaft": "Gewerbliche Wirtschaft",
    "Verarbeitendes Gewerbe": "Verarbeitendes Gewerbe",
    Dienstleistungssektor: "Dienstleistungssektor",
    Handel: "Handel",
    Grosshandel: "Großhandel",
    Einzelhandel: "Einzelhandel",
    Bauhauptgewerbe: "Bauhauptgewerbe",
    Deutschland: "Deutschland"
  },

  // Die vier Themen der Startseite. Jede Kachel zeigt den letzten Wert, die
  // Veraenderung zum Vormonat, eine Sparkline und den Datenstand.
  themen: [
    {
      id: "geschaeftsklima",
      titel: "ifo Geschäftsklima",
      seite: "geschaeftsklima.html",
      beschreibung: "Stimmung der Unternehmen in Deutschland, Index und Salden.",
      dataset: "gsk_deutschland",
      series: "Geschaeftsklima",
      sector: "Deutschland"
    },
    {
      id: "exporterwartungen",
      titel: "ifo Exporterwartungen",
      seite: "exporterwartungen.html",
      beschreibung: "Exporterwartungen im Verarbeitenden Gewerbe.",
      dataset: "export",
      series: "Exporterwartungen",
      sector: "Verarbeitendes Gewerbe"
    },
    {
      id: "importklima",
      titel: "ifo Importklima",
      seite: "importklima.html",
      beschreibung: "Frühindikator für die deutschen Importe.",
      // Die Einheit aus der Quelldatei ist fuer die Kachel zu lang; die
      // vollstaendige Bezeichnung samt Vorbehalt steht auf der Themenseite.
      einheitKurz: "Indexwerte, saisonbereinigt",
      dataset: "imklima",
      series: "Importklima",
      sector: "Deutschland"
    },
    {
      id: "beschaeftigungsbarometer",
      titel: "ifo Beschäftigungsbarometer",
      seite: "beschaeftigungsbarometer.html",
      beschreibung: "Beschäftigungspläne der Unternehmen, Index und Bereiche.",
      dataset: "empl",
      series: "Beschaeftigungsbarometer",
      sector: "Deutschland"
    }
  ]
};
