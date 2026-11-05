// ---------------------------------------------------------------------------
// config.js — zentrale Konfiguration der Website
//
// Der Seitenname steht ausschliesslich hier. Eine Aenderung von SITE.name
// wirkt auf alle Seiten (Kopfzeile, Fusszeile, Seitentitel im Browser).
// ---------------------------------------------------------------------------

window.SITE = {
  // Name der Seite. Steht im Browser-Titel und in der Fusszeile.
  // Zum Umbenennen genuegt diese eine Zeile.
  name: "Konjunkturindikatoren",

  // Was links oben in der Ecke steht und zur Startseite zurueckfuehrt.
  // Bewusst getrennt vom Namen: in der Ecke der Herausgeber, im Titel das
  // Thema. Ohne Eintrag wird name verwendet.
  marke: "ifo Institut",

  // Hinweis, der auf jeder Seite erscheint.
  disclaimer: "Prototyp, keine offizielle Veröffentlichung des ifo Instituts",

  // Rueckfallebene fuer den Datenstand. Normalerweise kommt er aus
  // site/data.js, wo R/build_data.R ihn aus dem Namen der Rohdatei ablegt -
  // dann muss hier nach einem Update nichts geaendert werden.
  stand: "Oktober 2026",

  // Die Seite beim ifo Institut, auf der die jeweilige Reihe veroeffentlicht
  // wird. Die Quellenangabe unter jedem Diagramm verlinkt hierhin, damit die
  // Zuordnung zur Originalquelle eindeutig ist. Alle URLs am 05.11.2026 auf
  // ifo.de geprueft (Status 200).
  quellenLinks: {
    gsk_deutschland: "https://www.ifo.de/umfrage/ifo-geschaeftsklima-deutschland",
    gsk_bereiche:    "https://www.ifo.de/umfrage/ifo-geschaeftsklima-deutschland",
    empl:            "https://www.ifo.de/umfrage/ifo-beschaeftigungsbarometer",
    export:          "https://www.ifo.de/umfrage/ifo-exporterwartungen",
    // Fuer das Importklima gibt es auf ifo.de keine eigene Themenseite; die
    // Reihe wird nur ueber die Zeitreihen-Seite veroeffentlicht.
    imklima:         "https://www.ifo.de/ifo-zeitreihen"
  },

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
      id: "beschaeftigungsbarometer",
      titel: "ifo Beschäftigungsbarometer",
      seite: "beschaeftigungsbarometer.html",
      beschreibung: "Beschäftigungspläne der Unternehmen, Index und Bereiche.",
      dataset: "empl",
      series: "Beschaeftigungsbarometer",
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
    }
  ]
};
