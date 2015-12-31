define(
   ({
    _widgetLabel : "Ricerca geografica",
    description : "Accedere o trascinare un <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> foglio di calcolo </a> qui per visualizzare e aggiungere dati mappa.",
    selectCSV : "Seleziona CSV",
    loadingCSV : "Caricamento CSV",
    savingCSV: "Esportazione CSV",
    clearResults : "Azzera",
    downloadResults : "Scarica",
    plotOnly : "Traccia solo i punti",
    plottingRows : "Tracciamento righe",
    messages : "Messaggi",
    error : {
      fetchingCSV : 'Errore durante il recupero dei dati da archivio CSV: ${0}',
      fileIssue : 'Impossibile elaborare il file.',
      notCSVFile : 'A questo punto, sono supportati solo file CSV.',
      invalidCoord : 'I campi posizione non sono validi. Controllare il file CSV.',
      tooManyRecords : 'Spiacenti, non più di ${0} record a questo punto.'
    },
    results : {
      csvLoaded : "${0} record del file CSV sono stati caricati",
      recordsPlotted : "${0}/${1} record sono stati individuati sulla mappa",
      recordsEnriched : "${0}/${1} elaborati, ${2} migliorati rispetto a ${3}",
      recordsError : "${0} record hanno restituito errori",
      recordsErrorList : "La riga ${0} presenta un problema",
      label: "Risultati CSV"
    }
  })
);
