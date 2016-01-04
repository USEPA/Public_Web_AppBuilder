define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Navigieren Sie zu einem <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> Arbeitsblatt </a>, oder ziehen Sie es hierhin, um Kartendaten zu visualisieren und ihm hinzuzufügen.",
    selectCSV : "CSV auswählen",
    loadingCSV : "Loading CSV",
    savingCSV: "CSVExport",
    clearResults : "Auswahl aufheben",
    downloadResults : "Herunterladen",
    plotOnly : "Nur Punkte darstellen",
    plottingRows : "Zeilen werden dargestellt",
    messages : "Meldungen",
    error : {
      fetchingCSV : 'Fehler beim Abrufen von Elementen aus dem CSV-Speicher: ${0}',
      fileIssue : 'Die Datei konnte nicht verarbeitet werden.',
      notCSVFile : 'Derzeit werden nur CSV-Dateien unterstützt.',
      invalidCoord : 'Positionsfelder sind ungültig. Überprüfen Sie die CSV.',
      tooManyRecords : 'Zurzeit leider nicht mehr als ${0} Datensätze.'
    },
    results : {
      csvLoaded : "${0} Datensätze aus der CSV-Datei wurden geladen",
      recordsPlotted : "${0}/${1} Datensätze wurden auf der Karte verortet",
      recordsEnriched : "${0}/${1} verarbeitet, ${2} mit ${3} angereichert",
      recordsError : "${0} Datensätze wiesen Fehler auf",
      recordsErrorList : "Bei der Zeile ${0} ist ein Problem aufgetreten",
      label: "CSV-Ergebnisse"
    }
  })
);
