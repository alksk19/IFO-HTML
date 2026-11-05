# ---------------------------------------------------------------------------
# build_data.R — Datenpipeline fuer den Konjunktur-Daten-Prototyp
#
# Liest die vier ifo-Excel-Dateien aus data/raw/, harmonisiert sie auf
# Monatsebene (YYYY-MM) und schreibt
#   - tidy CSVs nach data/clean/   (date, series, sector, value, unit, source)
#   - site/data.js als window.SITE_DATA = {...}
#
# Ein Lauf erneuert saemtliche Daten der Website:
#   Rscript R/build_data.R
#
# Einheiten und Spaltenbezeichnungen werden exakt so uebernommen, wie sie in
# den Quelldateien stehen. Unklarheiten sind in DATA.md dokumentiert und
# werden hier nicht durch eigene Annahmen ersetzt.
# ---------------------------------------------------------------------------

suppressPackageStartupMessages({
  library(readxl)
  library(dplyr)
  library(tidyr)
  library(jsonlite)
})

# --- Pfade -----------------------------------------------------------------
# Das Projektwurzelverzeichnis wird selbst bestimmt, damit das Skript sowohl
# per `Rscript R/build_data.R` aus der Wurzel als auch per Source/Run aus dem
# Ordner R/ heraus laeuft (RStudio setzt das Arbeitsverzeichnis dort nicht um).
find_root <- function() {
  has_raw <- function(p) dir.exists(file.path(p, "data", "raw"))
  # 1) Verzeichnis des Skripts selbst, falls ermittelbar
  cand <- character()
  a <- commandArgs(trailingOnly = FALSE)
  hit <- grep("^--file=", a, value = TRUE)
  if (length(hit)) cand <- c(cand, dirname(normalizePath(sub("^--file=", "", hit[1]))))
  sf <- sys.frames()
  for (fr in rev(sf)) {
    of <- fr$ofile
    if (!is.null(of)) { cand <- c(cand, dirname(normalizePath(of))); break }
  }
  # 2) Arbeitsverzeichnis
  cand <- c(cand, normalizePath(getwd()))
  for (start in cand) {
    p <- start
    for (i in 1:5) {
      if (has_raw(p)) return(p)
      up <- dirname(p)
      if (identical(up, p)) break
      p <- up
    }
  }
  stop("Projektwurzel nicht gefunden: kein Ordner data/raw/ oberhalb von ",
       normalizePath(getwd()), call. = FALSE)
}

root     <- find_root()
dir_raw  <- file.path(root, "data", "raw")
dir_out  <- file.path(root, "data", "clean")
dir_site <- file.path(root, "site")
dir.create(dir_out, showWarnings = FALSE, recursive = TRUE)
dir.create(dir_site, showWarnings = FALSE, recursive = TRUE)

# Die Dateinamen tragen den Datenstand (z. B. gsk-d-202610.xlsx). Statt sie
# fest einzutragen, wird je Reihe die neueste vorhandene Datei genommen - so
# laeuft das Skript nach einem Datenupdate ohne Aenderung weiter.
neueste <- function(praefix) {
  muster <- paste0("^", praefix, "-d-[0-9]{6}\\.xlsx$")
  treffer <- sort(list.files(dir_raw, pattern = muster))
  if (!length(treffer)) {
    stop("Keine Rohdatei gefunden fuer '", praefix, "' in ", dir_raw,
         " (erwartet z. B. ", praefix, "-d-202610.xlsx)", call. = FALSE)
  }
  file.path(dir_raw, tail(treffer, 1))
}

f_gsk  <- neueste("gsk")
f_exp  <- neueste("export")
f_empl <- neueste("empl")
f_imp  <- neueste("imklima")

message("Rohdateien: ", paste(basename(c(f_gsk, f_exp, f_empl, f_imp)), collapse = ", "))

# Datenstand aus dem Dateinamen der Geschaeftsklima-Datei ableiten; das
# Importklima erscheint einen Monat frueher und wird gesondert gefuehrt.
monat_aus_name <- function(p) {
  m <- regmatches(basename(p), regexpr("[0-9]{6}", basename(p)))
  if (!length(m)) return(NA_character_)
  paste0(substr(m, 1, 4), "-", substr(m, 5, 6))
}
stand_gsk <- monat_aus_name(f_gsk)
stand_imp <- monat_aus_name(f_imp)

# --- Hilfsfunktionen -------------------------------------------------------

# Datumsspalten liegen in zwei Varianten vor: als Text "MM/YYYY" (gsk) und
# als echte Excel-Datumsspalte (export, empl, imklima; readxl liefert dort
# POSIXct, sobald die Kopfzeilen uebersprungen werden). Beim
# Beschaeftigungsbarometer sind die Datumswerte Veroeffentlichungstage und
# keine Monatsenden; die Ableitung des Monats ist zulaessig, weil je Monat
# genau eine Zeile existiert (in build_data.R unten geprueft).
to_month <- function(x) {
  if (inherits(x, c("POSIXct", "POSIXt", "Date"))) {
    format(as.Date(x), "%Y-%m")
  } else {
    x <- trimws(as.character(x))
    ifelse(grepl("^[0-9]{2}/[0-9]{4}$", x),
           paste0(substr(x, 4, 7), "-", substr(x, 1, 2)),
           NA_character_)
  }
}

month_index <- function(m) {
  as.integer(substr(m, 1, 4)) * 12L + as.integer(substr(m, 6, 7))
}

# Prueft je Serie: genau eine Zeile pro Monat, keine Luecke in der
# Monatsfolge. Luecken werden nicht gefuellt, sondern gemeldet und in den
# Metadaten festgehalten.
check_months <- function(m, label) {
  if (any(is.na(m))) stop(label, ": Datum nicht lesbar in ", sum(is.na(m)), " Zeile(n)")
  if (any(duplicated(m))) stop(label, ": doppelte Monate: ",
                               paste(unique(m[duplicated(m)]), collapse = ", "))
  mi <- month_index(m)
  if (is.unsorted(mi)) stop(label, ": Monate nicht aufsteigend sortiert")
  gaps <- which(diff(mi) != 1L)
  if (length(gaps)) {
    message("  ! ", label, ": ", length(gaps), " Luecke(n) in der Monatsfolge nach ",
            paste(m[gaps], collapse = ", "))
  }
  invisible(m[gaps])
}

# Baut aus einer Datenspalte einen tidy-Block. Fuehrende und nachlaufende
# NAs werden entfernt (z.B. Exporterwartungen: die Datei enthaelt zwei
# Monatszeilen ohne Werte; Geschaeftsunsicherheit beginnt erst 04/2019).
tidy_block <- function(months, values, series, sector, unit, source) {
  v <- suppressWarnings(as.numeric(values))
  keep <- !is.na(v)
  if (!any(keep)) return(NULL)
  rng <- range(which(keep))
  idx <- rng[1]:rng[2]
  tibble::tibble(
    date   = months[idx],
    series = series,
    sector = sector,
    value  = round(v[idx], 4),
    unit   = unit,
    source = source
  ) |> filter(!is.na(value))
}

SRC_IFO <- "ifo Konjunkturumfragen, Oktober 2026 (ifo Institut)"
SRC_IMP <- "ifo Importklima, September 2026 (ifo Institut)"

message("Lese Rohdaten aus ", dir_raw)

# --- 1. Geschaeftsklima Deutschland (gsk, Sheet 1) -------------------------
# Kopfzeilen 1-9, Daten ab Zeile 10. Spalten:
#   1 Monat/Jahr (Text "MM/YYYY")
#   2-4 Indexwerte, 2015 = 100, saisonbereinigt: Klima / Lage / Erwartungen
#   5-7 Salden, saisonbereinigt:                 Klima / Lage / Erwartungen
#   8   ifo Geschaeftsunsicherheit, Ursprungswerte ab 04/2019
#   9   ifo Konjunkturampel, Wahrscheinlichkeit fuer eine expansive
#       Entwicklung in %
g1 <- suppressMessages(read_excel(f_gsk, sheet = 1, col_names = FALSE, skip = 9))
m1 <- to_month(g1[[1]])
check_months(m1, "Geschaeftsklima Deutschland")

gsk_de <- bind_rows(
  tidy_block(m1, g1[[2]], "Geschaeftsklima",       "Deutschland", "Indexwerte, 2015 = 100, saisonbereinigt", SRC_IFO),
  tidy_block(m1, g1[[3]], "Geschaeftslage",        "Deutschland", "Indexwerte, 2015 = 100, saisonbereinigt", SRC_IFO),
  tidy_block(m1, g1[[4]], "Geschaeftserwartungen", "Deutschland", "Indexwerte, 2015 = 100, saisonbereinigt", SRC_IFO),
  tidy_block(m1, g1[[5]], "Geschaeftsklima_saldo",       "Deutschland", "Salden, saisonbereinigt", SRC_IFO),
  tidy_block(m1, g1[[6]], "Geschaeftslage_saldo",        "Deutschland", "Salden, saisonbereinigt", SRC_IFO),
  tidy_block(m1, g1[[7]], "Geschaeftserwartungen_saldo", "Deutschland", "Salden, saisonbereinigt", SRC_IFO),
  tidy_block(m1, g1[[8]], "Geschaeftsunsicherheit", "Deutschland", "Ursprungswerte (Saldo), ab 04/2019", SRC_IFO),
  tidy_block(m1, g1[[9]], "Konjunkturampel",        "Deutschland", "Wahrscheinlichkeit fuer eine expansive Entwicklung in %", SRC_IFO)
)

# --- 2. Wirtschaftsbereiche (gsk, Sheet 2) ---------------------------------
# Kopfzeilen 1-9, Daten ab Zeile 10, Text-Datum. Je Bereich drei Spalten in
# der Reihenfolge Klima / Lage / Erwartungen. "Gewerbliche Wirtschaft" liegt
# zweimal vor: als Index (Spalten 2-4) und als Salden (5-7). Die sechs
# weiteren Bereiche sind ausschliesslich Salden.
g2 <- suppressMessages(read_excel(f_gsk, sheet = 2, col_names = FALSE, skip = 9))
m2 <- to_month(g2[[1]])
check_months(m2, "Wirtschaftsbereiche")

U_IDX <- "Indexwerte, 2015 = 100, saisonbereinigt"
U_SAL <- "Salden, saisonbereinigt"

bereiche <- list(
  list(col = 2,  sector = "Gewerbliche Wirtschaft",  unit = U_IDX, suffix = ""),
  list(col = 5,  sector = "Gewerbliche Wirtschaft",  unit = U_SAL, suffix = "_saldo"),
  list(col = 8,  sector = "Verarbeitendes Gewerbe",  unit = U_SAL, suffix = "_saldo"),
  list(col = 11, sector = "Dienstleistungssektor",   unit = U_SAL, suffix = "_saldo"),
  list(col = 14, sector = "Handel",                  unit = U_SAL, suffix = "_saldo"),
  list(col = 17, sector = "Grosshandel",             unit = U_SAL, suffix = "_saldo"),
  list(col = 20, sector = "Einzelhandel",            unit = U_SAL, suffix = "_saldo"),
  list(col = 23, sector = "Bauhauptgewerbe",         unit = U_SAL, suffix = "_saldo")
)
komponenten <- c("Geschaeftsklima", "Geschaeftslage", "Geschaeftserwartungen")

gsk_bereiche <- bind_rows(lapply(bereiche, function(b) {
  bind_rows(lapply(seq_along(komponenten), function(k) {
    tidy_block(m2, g2[[b$col + k - 1L]],
               paste0(komponenten[k], b$suffix), b$sector, b$unit, SRC_IFO)
  }))
}))

# --- 3. Exporterwartungen --------------------------------------------------
# Kopfzeilen 1-9, Daten ab Zeile 10, echte Datumsspalte. Die Datei enthaelt
# zwei Monatszeilen ohne Werte am Ende (11/2026, 12/2026); tidy_block
# schneidet sie ab.
ex <- suppressMessages(read_excel(f_exp, sheet = 1, col_names = FALSE, skip = 9))
mex <- to_month(ex[[1]])
check_months(mex, "Exporterwartungen")

export <- tidy_block(mex, ex[[2]], "Exporterwartungen",
                     "Verarbeitendes Gewerbe", U_SAL, SRC_IFO)

# --- 4. Beschaeftigungsbarometer -------------------------------------------
# Kopfzeilen 1-9, Daten ab Zeile 10, echte Datumsspalte. Die Datumswerte
# sind Veroeffentlichungstage (frueh Monatsenden, spaeter Pressetermine) und
# werden auf den Monat reduziert; check_months stellt sicher, dass dabei
# nichts zusammenfaellt. Die Datei bezeichnet in der Kopfzeile nur
# "Indexwerte, 2015 = 100" und labelt die vier Bereichsspalten nicht
# einzeln; deren Einheit ist offen (siehe DATA.md) und wird hier bewusst
# nicht als Saldo deklariert.
em <- suppressMessages(read_excel(f_empl, sheet = 1, col_names = FALSE, skip = 9))
mem <- to_month(em[[1]])
check_months(mem, "Beschaeftigungsbarometer")

U_EMPL_SEKTOR <- "Einheit in der Quelldatei nicht ausgewiesen (siehe DATA.md)"

empl <- bind_rows(
  tidy_block(mem, em[[2]], "Beschaeftigungsbarometer", "Deutschland", U_IDX, SRC_IFO),
  tidy_block(mem, em[[3]], "Beschaeftigungsbarometer", "Verarbeitendes Gewerbe", U_EMPL_SEKTOR, SRC_IFO),
  tidy_block(mem, em[[4]], "Beschaeftigungsbarometer", "Bauhauptgewerbe",        U_EMPL_SEKTOR, SRC_IFO),
  tidy_block(mem, em[[5]], "Beschaeftigungsbarometer", "Handel",                 U_EMPL_SEKTOR, SRC_IFO),
  tidy_block(mem, em[[6]], "Beschaeftigungsbarometer", "Dienstleistungssektor",  U_EMPL_SEKTOR, SRC_IFO)
)

# --- 5. Importklima --------------------------------------------------------
# Sheet "de", Kopfzeilen 1-10, Daten ab Zeile 11, echte Datumsspalte. Die
# Datei bezeichnet die Spalte R1 als "ifo Importklima (Indexwerte,
# saisonbereinigt)". Die Werte schwanken um 0 (etwa -3,1 bis 1,4) und sind
# damit kein auf 2015 = 100 normierter Index; die Bezeichnung wird
# unveraendert uebernommen und in DATA.md als offene Frage vermerkt.
im <- suppressMessages(read_excel(f_imp, sheet = 1, col_names = FALSE, skip = 10))
mim <- to_month(im[[1]])
check_months(mim, "Importklima")

imklima <- tidy_block(mim, im[[2]], "Importklima", "Deutschland",
                      "Indexwerte, saisonbereinigt (Bezeichnung aus der Quelldatei, siehe DATA.md)",
                      SRC_IMP)

# --- Metadaten je Serie ----------------------------------------------------
# Startmonat, Endmonat, Anzahl Beobachtungen und Luecken in der Monatsfolge.
series_meta <- function(df, dataset) {
  df |>
    group_by(dataset = dataset, series, sector, unit, source) |>
    arrange(date, .by_group = TRUE) |>
    summarise(
      start = first(date),
      end   = last(date),
      n     = n(),
      gaps  = {
        mi <- month_index(date)
        g  <- which(diff(mi) != 1L)
        if (length(g)) paste(date[g], collapse = "; ") else ""
      },
      .groups = "drop"
    )
}

datasets <- list(
  gsk_deutschland = gsk_de,
  gsk_bereiche    = gsk_bereiche,
  export          = export,
  empl            = empl,
  imklima         = imklima
)

meta <- bind_rows(lapply(names(datasets), function(n) series_meta(datasets[[n]], n)))

# --- CSVs schreiben --------------------------------------------------------
for (n in names(datasets)) {
  p <- file.path(dir_out, paste0(n, ".csv"))
  write.csv(datasets[[n]], p, row.names = FALSE, na = "", fileEncoding = "UTF-8")
  message("  geschrieben: ", basename(p), " (", nrow(datasets[[n]]), " Zeilen)")
}
write.csv(meta, file.path(dir_out, "series_meta.csv"),
          row.names = FALSE, na = "", fileEncoding = "UTF-8")
message("  geschrieben: series_meta.csv (", nrow(meta), " Serien)")

# --- site/data.js ----------------------------------------------------------
# Die Website laedt keine Dateien per fetch(), damit index.html direkt von
# der Festplatte (file://) funktioniert. Die Daten werden deshalb als
# JavaScript-Objekt eingebettet. Pro Datensatz eine Liste von Serien mit
# gemeinsamem Monatsvektor, damit data.js kompakt bleibt.
to_payload <- function(df) {
  lapply(split(df, list(df$series, df$sector), drop = TRUE), function(s) {
    s <- arrange(s, date)
    list(
      series = s$series[1],
      sector = s$sector[1],
      unit   = s$unit[1],
      source = s$source[1],
      start  = s$date[1],
      end    = s$date[nrow(s)],
      dates  = s$date,
      values = s$value
    )
  }) |> unname()
}

# Der Datenstand wandert in die Daten selbst, damit die Website ihn nicht fest
# eingetragen haben muss und sich nach einem Update von allein mitzieht.
payload <- list(
  generated = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
  stand     = stand_gsk,
  standImportklima = stand_imp,
  datasets  = lapply(datasets, to_payload),
  meta      = lapply(split(meta, seq_len(nrow(meta))), as.list) |> unname()
)

js <- paste0(
  "// Automatisch erzeugt von R/build_data.R — nicht von Hand bearbeiten.\n",
  "// Erneuern mit: Rscript R/build_data.R\n",
  "window.SITE_DATA = ",
  toJSON(payload, auto_unbox = TRUE, digits = 6, na = "null", pretty = 2),
  ";\n"
)
writeLines(js, file.path(dir_site, "data.js"), useBytes = TRUE)
message("  geschrieben: site/data.js (",
        round(file.size(file.path(dir_site, "data.js")) / 1024), " kB)")

# --- Zusammenfassung -------------------------------------------------------
message("\nSerien je Datensatz:")
print(as.data.frame(meta |> select(dataset, series, sector, start, end, n, gaps)),
      row.names = FALSE, right = FALSE)
message("\nFertig.")
