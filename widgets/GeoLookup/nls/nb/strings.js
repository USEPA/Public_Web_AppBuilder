define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Bla til eller dra et <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> regneark</a> her for å visualisere, og legg til kartdata i det.",
    selectCSV : "Velg en CSV",
    loadingCSV : "Laste inn CSV",
    savingCSV: "CSVExport",
    clearResults : "Tøm",
    downloadResults : "Nedlasting",
    plotOnly : "Tegn inn bare punkter",
    plottingRows : "Tegn inn rader",
    messages : "Meldinger",
    error : {
      fetchingCSV : 'Feil under henting av elementer fra CSV: ${0}',
      fileIssue : 'Kan ikke behandle filen.',
      notCSVFile : 'Det er kun støtte for kommadelte filer (.csv) på nåværende tidspunkt.',
      invalidCoord : 'Lokasjonsfeltene er ugyldige. Kontroller CSV-filen.',
      tooManyRecords : 'Du kan ikke ha mer enn ${0} poster på nåværende tidspunkt.'
    },
    results : {
      csvLoaded : "Det er lastet inn ${0} poster fra CSV-filen",
      recordsPlotted : "${0}/${1} poster er funnet på kartet",
      recordsEnriched : "${0}/${1} behandlet, ${2} supplert mot ${3}",
      recordsError : "${0} poster inneholder feil",
      recordsErrorList : "Feil i rad ${0}",
      label: "CSV-resultater"
    }
  })
);
