# ---------------------------------------------------------------------------
# update_data.R — holt die aktuellen ifo-Zeitreihen nach data/raw/
#
# Liest die Seite ifo.de/ifo-zeitreihen, sucht dort die Links auf die
# Excel-Dateien und laedt sie herunter, sofern sie noch nicht vorliegen.
# Danach erzeugt R/build_data.R die Website-Daten neu:
#
#   Rscript R/update_data.R && Rscript R/build_data.R
#
# Es werden keine Dateien geloescht und keine ueberschrieben: ein neuer
# Datenstand kommt als zusaetzliche Datei dazu (gsk-d-202611.xlsx neben
# gsk-d-202610.xlsx). build_data.R nimmt jeweils die neueste.
#
# Rueckgabe: Beendet sich mit Status 0, auch wenn es nichts Neues gibt.
# ---------------------------------------------------------------------------

quelle <- "https://www.ifo.de/ifo-zeitreihen"

find_root <- function() {
  has_raw <- function(p) dir.exists(file.path(p, "data", "raw"))
  cand <- character()
  a <- commandArgs(trailingOnly = FALSE)
  hit <- grep("^--file=", a, value = TRUE)
  if (length(hit)) cand <- c(cand, dirname(normalizePath(sub("^--file=", "", hit[1]))))
  cand <- c(cand, normalizePath(getwd()))
  for (start in cand) {
    p <- start
    for (i in 1:5) {
      if (has_raw(p)) return(p)
      up <- dirname(p); if (identical(up, p)) break
      p <- up
    }
  }
  stop("Projektwurzel nicht gefunden (kein data/raw/ oberhalb von ",
       normalizePath(getwd()), ")", call. = FALSE)
}

root    <- find_root()
dir_raw <- file.path(root, "data", "raw")

message("Lese ", quelle)
seite <- tryCatch(
  paste(readLines(quelle, warn = FALSE, encoding = "UTF-8"), collapse = "\n"),
  error = function(e) {
    message("Seite nicht erreichbar: ", conditionMessage(e))
    quit(status = 0)
  }
)

# --- 1) Die drei Reihen mit sprechendem Dateinamen --------------------------
# Muster: .../timeseries/gsk-d-202610.xlsx
treffer <- regmatches(seite, gregexpr("[^\"']*timeseries/[a-z]+-d-[0-9]{6}\\.xlsx", seite))[[1]]
treffer <- unique(treffer)

vollstaendig <- function(u) if (grepl("^http", u)) u else paste0("https://www.ifo.de", sub("^(?!/)", "/", u, perl = TRUE))

geladen <- character()

for (u in treffer) {
  name <- basename(u)
  # Nur die Reihen, die dieses Projekt auswertet - ifo.de bietet dort auch
  # Ostdeutschland und Sachsen an.
  if (!grepl("^(gsk|export|empl)-d-[0-9]{6}\\.xlsx$", name)) next
  ziel <- file.path(dir_raw, name)
  if (file.exists(ziel)) { message("  liegt bereits vor: ", name); next }
  message("  lade ", name)
  ok <- tryCatch({
    download.file(vollstaendig(u), ziel, mode = "wb", quiet = TRUE); TRUE
  }, error = function(e) { message("    fehlgeschlagen: ", conditionMessage(e)); FALSE })
  if (ok) geladen <- c(geladen, name) else if (file.exists(ziel)) unlink(ziel)
}

# --- 2) Importklima: Link ohne sprechenden Namen ----------------------------
# Auf der Seite steht ein Link "ifo Importklima <Monat> <Jahr>" auf
# /media/<id>/download. Monat und Jahr stehen nur im Linktext, der Dateiname
# muss daraus gebildet werden.
MONATE <- c("Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
            "August", "September", "Oktober", "November", "Dezember")

m <- regmatches(seite, regexpr(
  "<a[^>]*href=\"([^\"]*/media/[0-9]+/download)\"[^>]*>\\s*ifo Importklima\\s+([A-Za-zäöü]+)\\s+([0-9]{4})",
  seite, perl = TRUE))

if (length(m)) {
  href  <- sub(".*href=\"([^\"]+)\".*", "\\1", m)
  monat <- sub(".*ifo Importklima\\s+([A-Za-zäöü]+)\\s+[0-9]{4}.*", "\\1", m)
  jahr  <- sub(".*ifo Importklima\\s+[A-Za-zäöü]+\\s+([0-9]{4}).*", "\\1", m)
  nr    <- match(monat, MONATE)

  if (!is.na(nr)) {
    name <- sprintf("imklima-d-%s%02d.xlsx", jahr, nr)
    ziel <- file.path(dir_raw, name)
    if (file.exists(ziel)) {
      message("  liegt bereits vor: ", name)
    } else {
      message("  lade ", name)
      ok <- tryCatch({
        download.file(vollstaendig(href), ziel, mode = "wb", quiet = TRUE); TRUE
      }, error = function(e) { message("    fehlgeschlagen: ", conditionMessage(e)); FALSE })
      if (ok) geladen <- c(geladen, name) else if (file.exists(ziel)) unlink(ziel)
    }
  } else {
    message("  Monatsname im Importklima-Link nicht erkannt: ", monat)
  }
} else {
  message("  Kein Importklima-Link auf der Seite gefunden.")
}

# --- 3) Ergebnis ------------------------------------------------------------
if (length(geladen)) {
  message("\nNeu geladen: ", paste(geladen, collapse = ", "))
} else {
  message("\nNichts Neues - der vorhandene Datenstand ist aktuell.")
}
