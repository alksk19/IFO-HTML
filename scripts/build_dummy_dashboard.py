#!/usr/bin/env python3
# -----------------------------------------------------------------------------
# build_dummy_dashboard.py — erzeugt die Dummy-Datenbasis fuer dashboard_v2.html
#
# Liest keine echten Quellen. Erzeugt:
#   - data/datasets.csv            Registry aller Grafiken
#   - data/dummy/<id>.csv          eine Datei je Grafik, Schema aus SCHEMA.md
#   - site/dashboard_v2_data.js    window.DASHBOARD_DATA (Zeitreihen/Querschnitte)
#   - site/dashboard_v2_registry.js window.DASHBOARD_REGISTRY (= Registry als JS)
#
# Lauf:  python3 scripts/build_dummy_dashboard.py
#
# Die Zahlen sind frei erfunden, nur zur Veranschaulichung von Form und
# Grossenordnung. Nichts davon ist eine Prognose oder eine echte Reihe.
# -----------------------------------------------------------------------------

import csv
import json
import math
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_DUMMY = os.path.join(ROOT, "data", "dummy")
DIR_SITE = os.path.join(ROOT, "site")
os.makedirs(DIR_DUMMY, exist_ok=True)

MONATE_VON, MONATE_BIS = "2015-01", "2026-10"


def monatsliste(von, bis):
    y, m = int(von[:4]), int(von[5:7])
    ey, em = int(bis[:4]), int(bis[5:7])
    out = []
    while (y, m) <= (ey, em):
        out.append("%04d-%02d" % (y, m))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out


MONATE = monatsliste(MONATE_VON, MONATE_BIS)

BUNDESLAENDER = [
    "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
    "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
    "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
    "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"
]


def reihe(seed, start, trend_pro_monat, amplitude, rauschen, n=None):
    """Deterministische Dummy-Zeitreihe: Trend + Saison + Rauschen."""
    rng = random.Random(seed)
    n = n or len(MONATE)
    werte = []
    v = start
    for i in range(n):
        saison = amplitude * math.sin(2 * math.pi * (i % 12) / 12)
        v += trend_pro_monat + rng.uniform(-rauschen, rauschen)
        werte.append(round(v + saison, 2))
    return werte


def quelle_destatis():
    return "Statistisches Bundesamt (Destatis), Genesis-Online; eigene Darstellung"


def quelle_ba():
    return "Bundesagentur für Arbeit, Statistik; eigene Darstellung"


def quelle_ifo():
    return "ifo Institut, ifo Konjunkturumfragen; eigene Darstellung"


def quelle_ezb():
    return "Europäische Zentralbank; eigene Darstellung"


def quelle_bbk():
    return "Deutsche Bundesbank, Zeitreihen-Datenbank; eigene Darstellung"


# -----------------------------------------------------------------------------
# Registry: eine Zeile je Grafik/Datensatz.
# status: frei | ifo_genehmigung | kostenpflichtig | platzhalter
# -----------------------------------------------------------------------------

REGISTRY = []


def reg(id, titel, rubrik, quelle, quelle_link, lizenz, einheit, frequenz,
        stand, csv_datei, status, download_erlaubt, notiz=""):
    REGISTRY.append({
        "id": id, "titel": titel, "rubrik": rubrik, "quelle": quelle,
        "quelle_link": quelle_link, "lizenz": lizenz, "einheit": einheit,
        "frequenz": frequenz, "stand": stand, "csv_datei": csv_datei,
        "status": status, "download_erlaubt": "ja" if download_erlaubt else "nein",
        "notiz": notiz
    })


# -----------------------------------------------------------------------------
# Datensätze: je ein Eintrag (id -> Liste von Zeitreihen/Querschnitten)
# -----------------------------------------------------------------------------

DATASETS = {}  # id -> {"typ": "A"/"B", "serien": [...]}


def serie_a(series, sector, unit, source, werte, dates=None):
    dates = dates or MONATE
    return {
        "series": series, "sector": sector, "unit": unit, "source": source,
        "start": dates[0], "end": dates[-1], "dates": dates, "values": werte
    }


def add_a(id, serien):
    DATASETS[id] = {"typ": "A", "serien": serien}


def add_b(id, zeilen, unit, stand, source):
    # zeilen: Liste von (bundesland, value)
    DATASETS[id] = {
        "typ": "B", "unit": unit, "stand": stand, "source": source,
        "zeilen": [{"bundesland": b, "value": v} for b, v in zeilen]
    }


# --- Kennzahlen / Startseite -------------------------------------------------

add_a("ifo_geschaeftsklima", [
    serie_a("Geschaeftsklima", "Deutschland", "Indexwerte (2015=100, saisonbereinigt)",
            quelle_ifo(), reihe(1, 95, 0.01, 2.0, 1.2))
])
reg("ifo_geschaeftsklima", "ifo Geschäftsklima", "kennzahlen", "ifo Institut",
    "https://www.ifo.de/umfrage/ifo-geschaeftsklima-deutschland",
    "Veröffentlichte Zeitreihe, frei nutzbar laut ifo.de",
    "Indexwerte (2015=100, saisonbereinigt)", "monatlich", MONATE[-1],
    "ifo_geschaeftsklima.csv", "frei", True)

add_a("inflation_vpi", [
    serie_a("VPI_veraenderung_vorjahr", None, "Veränderung ggü. Vorjahresmonat in %",
            quelle_destatis(), reihe(2, 2.0, 0.0, 1.5, 0.5))
])
reg("inflation_vpi", "Verbraucherpreisindex (Inflation)", "kennzahlen", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahresmonat in %", "monatlich", MONATE[-1],
    "inflation_vpi.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("arbeitslosenquote", [
    serie_a("Arbeitslosenquote", "BA", "in % der zivilen Erwerbspersonen",
            quelle_ba(), reihe(3, 6.0, -0.002, 0.4, 0.15)),
    serie_a("Arbeitslosenquote", "ILO", "in % der Erwerbspersonen (ILO-Konzept)",
            quelle_destatis(), reihe(4, 5.5, -0.002, 0.3, 0.15))
])
reg("arbeitslosenquote", "Arbeitslosenquote", "kennzahlen",
    "Bundesagentur für Arbeit / Destatis",
    "https://statistik.arbeitsagentur.de", "Freie Nutzung mit Quellenangabe",
    "in % der Erwerbspersonen", "monatlich", MONATE[-1],
    "arbeitslosenquote.csv", "frei", True)

add_a("bip_real", [
    serie_a("BIP_real", None, "Veränderung ggü. Vorjahresquartal in %",
            quelle_destatis(), reihe(5, 1.0, 0.0, 1.0, 0.6))
])
reg("bip_real", "Reales BIP-Wachstum", "kennzahlen", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahresquartal in %", "quartal", MONATE[-1],
    "bip_real.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("reallohn", [
    serie_a("Reallohnindex", None, "Index (2015=100)", quelle_destatis(),
            reihe(6, 98, 0.03, 1.0, 0.4))
])
reg("reallohn", "Reallohnindex", "kennzahlen", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Index (2015=100)", "quartal", MONATE[-1], "reallohn.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt")

# ezb_leitzins und bundesanleihe_10j: unten durch ECHTE_DATEN_OVERRIDE ersetzt
# (data/real/ezb_leitzins.csv, data/real/bundesanleihe_10j.csv). Platzhalter
# hier nur, damit die Registry-Zeile und ein Fallback existieren, falls die
# echten Dateien einmal fehlen sollten.
add_a("ezb_leitzins", [
    serie_a("Hauptrefinanzierungssatz", None, "in % p.a.", quelle_ezb(),
            reihe(7, 1.0, 0.0, 0.0, 0.05))
])
reg("ezb_leitzins", "EZB-Leitzins", "kennzahlen", "Europäische Zentralbank",
    "https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.MRR_FR.LEV",
    "Freie Nutzung mit Quellenangabe (ECB Data Portal)",
    "in % p.a.", "unregelmäßig, hier als Monatsendwert", MONATE[-1],
    "real/ezb_leitzins.csv", "frei", True,
    "Echte Daten (ECB Data Portal API, Reihe FM.D.U2.EUR.4F.KR.MRR_FR.LEV), siehe data/real/ezb_leitzins.csv")

add_a("bundesanleihe_10j", [
    serie_a("Rendite_10j_Bundesanleihe", None, "in % p.a.", quelle_bbk(),
            reihe(8, 1.0, 0.0, 0.2, 0.08))
])
reg("bundesanleihe_10j", "Rendite 10-jähriger Bundesanleihen", "kennzahlen",
    "Deutsche Bundesbank",
    "https://api.statistiken.bundesbank.de/rest/data/BBSIS/M.I.ZAR.ZI.EUR.S1311.B.A604.R10XX.R.A.A._Z._Z.A",
    "Freie Nutzung mit Quellenangabe (Bundesbank-Zeitreihen-API)",
    "in % p.a.", "monatlich", MONATE[-1], "real/bundesanleihe_10j.csv", "frei", True,
    "Echte Daten (Bundesbank-Zeitreihen-API, Reihe BBSIS.M.I.ZAR.ZI.EUR.S1311.B.A604.R10XX.R.A.A._Z._Z.A), siehe data/real/bundesanleihe_10j.csv")

add_a("dax", [
    serie_a("DAX_Schlusskurs", None, "Punkte", "unbekannt",
            reihe(9, 12000, 25, 300, 150))
])
reg("dax", "DAX", "kennzahlen", "unbekannt", "", "unbekannt — vor Veröffentlichung zu prüfen",
    "Punkte", "täglich/Monatsende", MONATE[-1], "dax.csv", "kostenpflichtig", False,
    "Lizenzlage von Börsendaten noch nicht geklärt")

add_a("ifo_konjunkturprognose", [
    serie_a("BIP_Prognose", None, "Veränderung ggü. Vorjahr in %", quelle_ifo(),
            reihe(10, 1.0, 0.0, 0.3, 0.3))
])
reg("ifo_konjunkturprognose", "ifo Konjunkturprognose", "startseite", "ifo Institut",
    "https://www.ifo.de/konjunkturprognose",
    "Veröffentlichung wird mit ifo geklärt",
    "Veränderung ggü. Vorjahr in %", "quartal", MONATE[-1],
    "ifo_konjunkturprognose.csv", "ifo_genehmigung", False)

# --- BIP ----------------------------------------------------------------

add_a("bip_wachstum", [
    serie_a("BIP", "ggü. Vorquartal", "Veränderung ggü. Vorquartal in %, preis-, kalender- und saisonbereinigt",
            quelle_destatis(), reihe(11, 0.3, 0.0, 0.4, 0.3)),
    serie_a("BIP", "ggü. Vorjahr", "Veränderung ggü. Vorjahresquartal in %, preisbereinigt",
            quelle_destatis(), reihe(12, 1.0, 0.0, 1.0, 0.4))
])
reg("bip_wachstum", "BIP-Wachstum (Quartal/Jahr)", "bip", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung in %", "quartal", MONATE[-1], "bip_wachstum.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt")

add_a("bip_bws_preise", [
    serie_a("BIP", "preisbereinigt", "Veränderung ggü. Vorjahr in %, preisbereinigt",
            quelle_destatis(), reihe(13, 1.0, 0.0, 0.8, 0.3)),
    serie_a("BIP", "jeweilige_preise", "Veränderung ggü. Vorjahr in %, jeweilige Preise",
            quelle_destatis(), reihe(14, 2.5, 0.0, 0.8, 0.3)),
    serie_a("Bruttowertschoepfung", "preisbereinigt", "Veränderung ggü. Vorjahr in %, preisbereinigt",
            quelle_destatis(), reihe(15, 0.9, 0.0, 0.8, 0.3)),
    serie_a("Bruttowertschoepfung", "jeweilige_preise", "Veränderung ggü. Vorjahr in %, jeweilige Preise",
            quelle_destatis(), reihe(16, 2.3, 0.0, 0.8, 0.3))
])
reg("bip_bws_preise", "BIP und Bruttowertschöpfung (preisbereinigt / jeweilige Preise)",
    "bip", "Destatis", "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahr in %", "quartal", MONATE[-1],
    "bip_bws_preise.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("wachstumsbeitraege", [
    serie_a("Privater_Konsum", None, "Wachstumsbeitrag in Prozentpunkten",
            quelle_destatis(), reihe(17, 0.5, 0.0, 0.5, 0.3)),
    serie_a("Staatskonsum", None, "Wachstumsbeitrag in Prozentpunkten",
            quelle_destatis(), reihe(18, 0.2, 0.0, 0.2, 0.15)),
    serie_a("Bruttoanlageinvestitionen", None, "Wachstumsbeitrag in Prozentpunkten",
            quelle_destatis(), reihe(19, 0.1, 0.0, 0.4, 0.3)),
    serie_a("Aussenbeitrag", None, "Wachstumsbeitrag in Prozentpunkten",
            quelle_destatis(), reihe(20, 0.1, 0.0, 0.5, 0.3))
])
reg("wachstumsbeitraege", "Wachstumsbeiträge zum BIP", "bip", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Wachstumsbeitrag in Prozentpunkten", "quartal", MONATE[-1],
    "wachstumsbeitraege.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("ifo_konjunkturuhr", [
    serie_a("Geschaeftslage", None, "Saldo, saisonbereinigt, Abweichung vom langjährigen Mittel",
            quelle_ifo(), reihe(21, 0, 0.0, 8, 3)),
    serie_a("Geschaeftserwartungen", None, "Saldo, saisonbereinigt, Abweichung vom langjährigen Mittel",
            quelle_ifo(), reihe(22, 0, 0.0, 8, 3))
])
reg("ifo_konjunkturuhr", "ifo Konjunkturuhr", "bip", "ifo Institut",
    "https://www.ifo.de/umfrage/ifo-geschaeftsklima-deutschland",
    "Veröffentlichung wird mit ifo geklärt",
    "Saldo, Abweichung vom langjährigen Mittel", "monatlich", MONATE[-1],
    "ifo_konjunkturuhr.csv", "ifo_genehmigung", False)

add_a("ifo_exporterwartungen", [
    serie_a("Exporterwartungen", "Verarbeitendes Gewerbe", "Salden (saisonbereinigt)",
            quelle_ifo(), reihe(23, 0, 0.0, 6, 3))
])
reg("ifo_exporterwartungen", "ifo Exporterwartungen", "bip", "ifo Institut",
    "https://www.ifo.de/umfrage/ifo-exporterwartungen",
    "Veröffentlichte Zeitreihe, frei nutzbar laut ifo.de",
    "Salden (saisonbereinigt)", "monatlich", MONATE[-1],
    "ifo_exporterwartungen.csv", "frei", True)

add_a("destatis_warenexporte", [
    serie_a("Warenexporte", None, "Veränderung ggü. Vorjahresmonat in %, kalender- und saisonbereinigt",
            quelle_destatis(), reihe(24, 1.0, 0.0, 2.0, 1.0))
])
reg("destatis_warenexporte", "Warenexporte", "bip", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahresmonat in %", "monatlich", MONATE[-1],
    "destatis_warenexporte.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("ifo_importklima", [
    serie_a("Importklima", "Deutschland", "Indexwerte, saisonbereinigt",
            quelle_ifo(), reihe(25, 0, 0.0, 0.6, 0.3))
])
reg("ifo_importklima", "ifo Importklima", "bip", "ifo Institut",
    "https://www.ifo.de/ifo-zeitreihen",
    "Veröffentlichte Zeitreihe, frei nutzbar laut ifo.de",
    "Indexwerte, saisonbereinigt", "monatlich", MONATE[-1],
    "ifo_importklima.csv", "frei", True)

add_a("destatis_warenimporte", [
    serie_a("Warenimporte", None, "Veränderung ggü. Vorjahresmonat in %, kalender- und saisonbereinigt",
            quelle_destatis(), reihe(26, 0.8, 0.0, 2.0, 1.0))
])
reg("destatis_warenimporte", "Warenimporte", "bip", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahresmonat in %", "monatlich", MONATE[-1],
    "destatis_warenimporte.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

# --- Arbeitsmarkt --------------------------------------------------------

add_a("arbeitslosenquote_gruppen", [
    serie_a("Arbeitslosenquote", "15_bis_24_Jahre", "in %", quelle_ba(),
            reihe(27, 6.5, -0.002, 0.5, 0.2)),
    serie_a("Arbeitslosenquote", "55_bis_64_Jahre", "in %", quelle_ba(),
            reihe(28, 7.0, -0.002, 0.4, 0.2)),
    serie_a("Arbeitslosenquote", "Frauen", "in %", quelle_ba(),
            reihe(29, 5.8, -0.002, 0.3, 0.2)),
    serie_a("Arbeitslosenquote", "Maenner", "in %", quelle_ba(),
            reihe(30, 6.1, -0.002, 0.3, 0.2)),
    serie_a("Langzeitarbeitslosenquote", None, "in %", quelle_ba(),
            reihe(31, 2.5, -0.001, 0.2, 0.1))
])
reg("arbeitslosenquote_gruppen", "Arbeitslosigkeit nach Gruppen", "arbeitsmarkt",
    "Bundesagentur für Arbeit", "https://statistik.arbeitsagentur.de",
    "Freie Nutzung mit Quellenangabe", "in %", "monatlich", MONATE[-1],
    "arbeitslosenquote_gruppen.csv", "frei", True)

add_a("beschaeftigung_branchen", [
    serie_a("Beschaeftigte", "Verarbeitendes_Gewerbe", "Veränderung ggü. Vorjahr in %",
            quelle_destatis(), reihe(32, 0.2, 0.0, 0.5, 0.3)),
    serie_a("Beschaeftigte", "Dienstleistungssektor", "Veränderung ggü. Vorjahr in %",
            quelle_destatis(), reihe(33, 1.0, 0.0, 0.4, 0.2)),
    serie_a("Beschaeftigte", "Baugewerbe", "Veränderung ggü. Vorjahr in %",
            quelle_destatis(), reihe(34, 0.8, 0.0, 0.5, 0.3)),
    serie_a("Beschaeftigte", "Handel", "Veränderung ggü. Vorjahr in %",
            quelle_destatis(), reihe(35, 0.3, 0.0, 0.4, 0.2))
])
reg("beschaeftigung_branchen", "Beschäftigung nach Branchen", "arbeitsmarkt",
    "Destatis", "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahr in %", "monatlich", MONATE[-1],
    "beschaeftigung_branchen.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("erwerbstaetigenquote", [
    serie_a("Erwerbstaetigenquote", None, "in % der Bevölkerung 15-64",
            quelle_destatis(), reihe(36, 75, 0.01, 0.3, 0.1))
])
reg("erwerbstaetigenquote", "Erwerbstätigenquote", "arbeitsmarkt", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "in % der Bevölkerung 15-64", "jährlich", MONATE[-1],
    "erwerbstaetigenquote.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("erwerbsquote", [
    serie_a("Erwerbsquote", None, "in % der Bevölkerung 15-64",
            quelle_destatis(), reihe(37, 78, 0.01, 0.3, 0.1))
])
reg("erwerbsquote", "Erwerbsquote", "arbeitsmarkt", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "in % der Bevölkerung 15-64", "jährlich", MONATE[-1],
    "erwerbsquote.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("loehne_alter", [
    serie_a("Bruttomonatsverdienst", "unter_25", "Euro", quelle_destatis(),
            reihe(38, 2400, 4, 20, 10)),
    serie_a("Bruttomonatsverdienst", "25_bis_54", "Euro", quelle_destatis(),
            reihe(39, 4100, 6, 30, 15)),
    serie_a("Bruttomonatsverdienst", "55_und_aelter", "Euro", quelle_destatis(),
            reihe(40, 4400, 6, 30, 15))
])
reg("loehne_alter", "Löhne nach Alter", "arbeitsmarkt", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0", "Euro",
    "jährlich", MONATE[-1], "loehne_alter.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt")

add_a("loehne_branche", [
    serie_a("Bruttomonatsverdienst", "Verarbeitendes_Gewerbe", "Euro", quelle_destatis(),
            reihe(41, 4300, 6, 30, 15)),
    serie_a("Bruttomonatsverdienst", "Dienstleistungssektor", "Euro", quelle_destatis(),
            reihe(42, 3900, 6, 30, 15)),
    serie_a("Bruttomonatsverdienst", "Baugewerbe", "Euro", quelle_destatis(),
            reihe(43, 3600, 6, 30, 15))
])
reg("loehne_branche", "Löhne nach Branche", "arbeitsmarkt", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0", "Euro",
    "jährlich", MONATE[-1], "loehne_branche.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt")

_loehne_bl = []
_rng_bl = random.Random(44)
for i, bl in enumerate(BUNDESLAENDER):
    basis = 3600 + i * 60 + _rng_bl.uniform(-150, 150)
    _loehne_bl.append(serie_a("Bruttomonatsverdienst", bl.replace(" ", "_").replace("ü", "ue").replace("ä", "ae"),
                               "Euro", quelle_destatis(),
                               reihe(100 + i, basis, 5, 20, 10)))
add_a("loehne_bundesland", _loehne_bl)
reg("loehne_bundesland", "Löhne nach Bundesland", "arbeitsmarkt", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0", "Euro",
    "jährlich", MONATE[-1], "loehne_bundesland.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt")

add_a("ifo_beschaeftigungsbarometer", [
    serie_a("Beschaeftigungsbarometer", "Deutschland", "Indexwerte (2015=100, saisonbereinigt)",
            quelle_ifo(), reihe(45, 98, 0.0, 1.0, 0.6))
])
reg("ifo_beschaeftigungsbarometer", "ifo Beschäftigungsbarometer", "arbeitsmarkt",
    "ifo Institut", "https://www.ifo.de/umfrage/ifo-beschaeftigungsbarometer",
    "Veröffentlichte Zeitreihe, frei nutzbar laut ifo.de",
    "Indexwerte (2015=100, saisonbereinigt)", "monatlich", MONATE[-1],
    "ifo_beschaeftigungsbarometer.csv", "frei", True)

for seed, (id, titel) in enumerate([
    ("ifo_fachkraeftemangel", "ifo Fachkräftemangel"),
    ("ifo_kurzarbeit", "ifo Kurzarbeit"),
    ("ifo_homeoffice", "ifo Homeoffice"),
], start=70):
    add_a(id, [serie_a(titel.replace("ifo ", "").replace(" ", "_"), None,
                        "in % der Unternehmen", quelle_ifo(),
                        reihe(seed, 20, 0.0, 3, 2))])
    reg(id, titel, "arbeitsmarkt", "ifo Institut",
        "https://www.ifo.de/umfragen/zeitreihen",
        "Sonderauswertung, kostenpflichtig",
        "in % der Unternehmen", "quartal", MONATE[-1], id + ".csv",
        "kostenpflichtig", False)

# --- Inflation & Preise --------------------------------------------------

add_a("vpi_guetergruppen", [
    serie_a("VPI_veraenderung_vorjahr", "Nahrungsmittel", "Veränderung ggü. Vorjahresmonat in %",
            quelle_destatis(), reihe(46, 3.0, 0.0, 1.5, 0.7)),
    serie_a("VPI_veraenderung_vorjahr", "Energie", "Veränderung ggü. Vorjahresmonat in %",
            quelle_destatis(), reihe(47, 1.0, 0.0, 4.0, 2.0)),
    serie_a("VPI_veraenderung_vorjahr", "Dienstleistungen", "Veränderung ggü. Vorjahresmonat in %",
            quelle_destatis(), reihe(48, 2.5, 0.0, 0.8, 0.4))
])
reg("vpi_guetergruppen", "Preiskaleidoskop (Gütergruppen)", "inflation", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahresmonat in %", "monatlich", MONATE[-1],
    "vpi_guetergruppen.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("vpi_index", [
    serie_a("VPI_index", None, "Index (2020=100)", quelle_destatis(),
            reihe(49, 95, 0.15, 0.3, 0.1))
])
reg("vpi_index", "Verbraucherpreise als Index", "inflation", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Index (2020=100)", "monatlich", MONATE[-1], "vpi_index.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt; Basis für Preiskaleidoskop-Umschalter und Kaufkraft-Rechner")

add_a("loehne_vs_vpi", [
    serie_a("Nominallohnindex", None, "Index (2020=100)", quelle_destatis(),
            reihe(50, 95, 0.2, 0.3, 0.15)),
    serie_a("VPI_index", None, "Index (2020=100)", quelle_destatis(),
            reihe(51, 95, 0.15, 0.3, 0.1))
])
reg("loehne_vs_vpi", "Löhne vs. Verbraucherpreise", "inflation", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Index (2020=100)", "quartal", MONATE[-1], "loehne_vs_vpi.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt")

add_a("ifo_preiserwartungen", [
    serie_a("Preiserwartungen", None, "Salden (saisonbereinigt)", quelle_ifo(),
            reihe(52, 20, 0.0, 5, 3))
])
reg("ifo_preiserwartungen", "ifo Preiserwartungen", "inflation", "ifo Institut",
    "https://www.ifo.de/umfragen/zeitreihen", "Sonderauswertung, kostenpflichtig",
    "Salden (saisonbereinigt)", "monatlich", MONATE[-1],
    "ifo_preiserwartungen.csv", "kostenpflichtig", False)

reg("tankrabatt_tracker", "Tankrabatt-Tracker", "inflation", "unbekannt", "",
    "unbekannt", "Euro/Liter", "unbekannt", MONATE[-1], "", "platzhalter", False,
    "Datenzugang und Quelle noch nicht geklärt")

# --- Rohstoffe & Energie -------------------------------------------------

add_a("einfuhrpreise", [
    serie_a("Einfuhrpreise", "Energie", "Veränderung ggü. Vorjahresmonat in %",
            quelle_destatis(), reihe(53, -2.0, 0.0, 5.0, 2.5)),
    serie_a("Einfuhrpreise", "Metalle", "Veränderung ggü. Vorjahresmonat in %",
            quelle_destatis(), reihe(54, 1.0, 0.0, 4.0, 2.0))
])
reg("einfuhrpreise", "Einfuhrpreise (Energie, Metalle)", "rohstoffe", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahresmonat in %", "monatlich", MONATE[-1],
    "einfuhrpreise.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("energiepreise", [
    serie_a("Energiepreise_Verbraucher", None, "Veränderung ggü. Vorjahresmonat in %",
            quelle_destatis(), reihe(55, 0.5, 0.0, 4.0, 2.0))
])
reg("energiepreise", "Energiepreise", "rohstoffe", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahresmonat in %", "monatlich", MONATE[-1],
    "energiepreise.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("ifo_materialmangel", [
    serie_a("Materialmangel", None, "in % der Unternehmen", quelle_ifo(),
            reihe(56, 15, 0.0, 3, 2))
])
reg("ifo_materialmangel", "ifo Materialmangel", "rohstoffe", "ifo Institut",
    "https://www.ifo.de/umfragen/zeitreihen", "Sonderauswertung, kostenpflichtig",
    "in % der Unternehmen", "monatlich", MONATE[-1], "ifo_materialmangel.csv",
    "kostenpflichtig", False)

# --- Wohnen --------------------------------------------------------------

_rng_miet = random.Random(60)
_miet_zeilen = [(bl, round(95 + i * 1.5 + _rng_miet.uniform(-4, 4), 1))
                for i, bl in enumerate(BUNDESLAENDER)]
add_b("mietindex_bundesland", _miet_zeilen, "Index (2020=100)", MONATE[-1], quelle_destatis())
reg("mietindex_bundesland", "Mietindex nach Bundesland", "wohnen", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Index (2020=100)", "jährlich", MONATE[-1], "mietindex_bundesland.csv",
    "frei", True, "Genesis-Tabellencode: unbekannt; benötigt Kartengrundlage, siehe geodaten_bundeslaender")

reg("geodaten_bundeslaender", "Geodatei der Bundesländer (Kartengrundlage)", "wohnen",
    "unbekannt", "", "unbekannt — vor Veröffentlichung zu prüfen", "—", "einmalig",
    "unbekannt", "", "platzhalter", False,
    "Keine Geometriedaten enthalten; Karte zeigt bis dahin ein Bundesland-Ranking als Balken")

_rng_miqu = random.Random(61)
_miqu_zeilen = [(bl, round(26 + _rng_miqu.uniform(-4, 6), 1)) for bl in BUNDESLAENDER]
add_b("mietbelastungsquote_bundesland", _miqu_zeilen, "in % des verfügbaren Haushaltseinkommens",
      MONATE[-1], quelle_destatis())
reg("mietbelastungsquote_bundesland", "Mietbelastungsquote nach Bundesland", "wohnen",
    "Destatis", "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "in % des verfügbaren Haushaltseinkommens", "jährlich", MONATE[-1],
    "mietbelastungsquote_bundesland.csv", "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("haeuserpreise", [
    serie_a("Haeuserpreisindex", "Staedte", "Index (2015=100)", quelle_destatis(),
            reihe(62, 120, 0.3, 1.0, 0.5)),
    serie_a("Haeuserpreisindex", "Laendlich", "Index (2015=100)", quelle_destatis(),
            reihe(63, 110, 0.2, 1.0, 0.5))
])
reg("haeuserpreise", "Häuserpreise", "wohnen", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Index (2015=100)", "quartal", MONATE[-1], "haeuserpreise.csv", "frei", True,
    "Genesis-Tabellencode: unbekannt")

add_a("baupreise", [
    serie_a("Baupreisindex", None, "Veränderung ggü. Vorjahr in %", quelle_destatis(),
            reihe(64, 3.0, 0.0, 1.0, 0.5))
])
reg("baupreise", "Baupreise", "wohnen", "Destatis",
    "https://www-genesis.destatis.de", "Datenlizenz by-2-0",
    "Veränderung ggü. Vorjahr in %", "jährlich", MONATE[-1], "baupreise.csv",
    "frei", True, "Genesis-Tabellencode: unbekannt")

add_a("ifo_geschaeftsklima_wohnungsbau", [
    serie_a("Geschaeftsklima_Wohnungsbau", None, "Salden (saisonbereinigt)", quelle_ifo(),
            reihe(65, -20, 0.0, 5, 3))
])
reg("ifo_geschaeftsklima_wohnungsbau", "ifo Geschäftsklima Wohnungsbau", "wohnen",
    "ifo Institut", "https://www.ifo.de/umfragen/zeitreihen",
    "Sonderauswertung, kostenpflichtig", "Salden (saisonbereinigt)", "monatlich",
    MONATE[-1], "ifo_geschaeftsklima_wohnungsbau.csv", "kostenpflichtig", False)

# -----------------------------------------------------------------------------
# Echte-Daten-Override: data/real/<id>.csv ersetzt die Zufallsreihe desselben
# Datensatzes, falls vorhanden. Die Registry-Zeile (Quelle, Lizenz, Status)
# wird weiterhin oben gepflegt; hier wird nur DATASETS[id] ausgetauscht, damit
# site/dashboard_v2_data.js echte statt erfundener Werte enthaelt.
# -----------------------------------------------------------------------------

DIR_REAL = os.path.join(ROOT, "data", "real")
n_real = 0
if os.path.isdir(DIR_REAL):
    for fname in sorted(os.listdir(DIR_REAL)):
        if not fname.endswith(".csv"):
            continue
        id = fname[:-4]
        if id not in DATASETS:
            print("WARNUNG: data/real/%s hat keinen passenden Registry-Eintrag, uebersprungen" % fname)
            continue
        serien_by_key = {}
        with open(os.path.join(DIR_REAL, fname), newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                key = (row["series"], row["sector"] or None)
                s = serien_by_key.setdefault(key, {
                    "series": row["series"], "sector": row["sector"] or None,
                    "unit": row["unit"], "source": row["source"],
                    "dates": [], "values": []
                })
                s["dates"].append(row["date"])
                s["values"].append(float(row["value"]))
        serien = []
        for s in serien_by_key.values():
            s["start"], s["end"] = s["dates"][0], s["dates"][-1]
            serien.append(s)
        DATASETS[id] = {"typ": "A", "serien": serien}
        n_real += 1

print("Echte-Daten-Overrides aus data/real/ angewendet:", n_real)

# -----------------------------------------------------------------------------
# Schreiben: data/datasets.csv
# -----------------------------------------------------------------------------

REG_SPALTEN = ["id", "titel", "rubrik", "quelle", "quelle_link", "lizenz",
               "einheit", "frequenz", "stand", "csv_datei", "status",
               "download_erlaubt", "notiz"]

with open(os.path.join(ROOT, "data", "datasets.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=REG_SPALTEN)
    w.writeheader()
    for row in REGISTRY:
        w.writerow(row)

print("data/datasets.csv geschrieben:", len(REGISTRY), "Zeilen")

# -----------------------------------------------------------------------------
# Schreiben: data/dummy/<id>.csv  (nur wenn ein Datensatz existiert)
# -----------------------------------------------------------------------------

n_csv = 0
for row in REGISTRY:
    if not row["csv_datei"] or row["id"] not in DATASETS:
        continue
    if row["csv_datei"].startswith("real/"):
        continue  # liegt schon als Quelle in data/real/, nicht erneut schreiben
    ds = DATASETS[row["id"]]
    path = os.path.join(DIR_DUMMY, row["csv_datei"])
    with open(path, "w", newline="", encoding="utf-8") as f:
        wtr = csv.writer(f)
        if ds["typ"] == "A":
            wtr.writerow(["date", "series", "sector", "value", "unit", "source"])
            for s in ds["serien"]:
                for d, v in zip(s["dates"], s["values"]):
                    wtr.writerow([d, s["series"], s["sector"] or "", v, s["unit"], s["source"]])
        else:
            wtr.writerow(["bundesland", "value", "unit", "stand", "source"])
            for z in ds["zeilen"]:
                wtr.writerow([z["bundesland"], z["value"], ds["unit"], ds["stand"], ds["source"]])
    n_csv += 1

print("data/dummy/*.csv geschrieben:", n_csv, "Dateien")

# -----------------------------------------------------------------------------
# Schreiben: site/dashboard_v2_data.js und site/dashboard_v2_registry.js
# -----------------------------------------------------------------------------

data_out = {"generated": "Dummy-Lauf, kein echter Datenstand", "datasets": {}}
for id, ds in DATASETS.items():
    if ds["typ"] == "A":
        data_out["datasets"][id] = ds["serien"]
    else:
        data_out["datasets"][id] = {
            "typ": "B", "unit": ds["unit"], "stand": ds["stand"],
            "source": ds["source"], "zeilen": ds["zeilen"]
        }

with open(os.path.join(DIR_SITE, "dashboard_v2_data.js"), "w", encoding="utf-8") as f:
    f.write("// Automatisch erzeugt von scripts/build_dummy_dashboard.py — nicht von Hand bearbeiten.\n")
    f.write("// Enthaelt AUSSCHLIESSLICH Dummy-Daten, keine echten Werte.\n")
    f.write("// Erneuern mit: python3 scripts/build_dummy_dashboard.py\n")
    f.write("window.DASHBOARD_DATA = ")
    f.write(json.dumps(data_out, ensure_ascii=False, indent=1))
    f.write(";\n")

with open(os.path.join(DIR_SITE, "dashboard_v2_registry.js"), "w", encoding="utf-8") as f:
    f.write("// Automatisch erzeugt von scripts/build_dummy_dashboard.py aus data/datasets.csv — nicht von Hand bearbeiten.\n")
    f.write("window.DASHBOARD_REGISTRY = ")
    f.write(json.dumps(REGISTRY, ensure_ascii=False, indent=1))
    f.write(";\n")

print("site/dashboard_v2_data.js und site/dashboard_v2_registry.js geschrieben.")
