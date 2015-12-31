define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Gå til eller træk et <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> regneark </a> herhen for at visualisere, og knyt kortdata til det.",
    selectCSV : "Vælg en CSV",
    loadingCSV : "Indlæser CSV",
    savingCSV: "CSVExport",
    clearResults : "Ryd",
    downloadResults : "Download",
    plotOnly : "Kun kortpunkter",
    plottingRows : "Tegner rækker",
    messages : "Meddelelser",
    error : {
      fetchingCSV : 'Fejl ved hentning af elementer fra CSV-lager: ${0}',
      fileIssue : 'Filen kunne ikke behandles.',
      notCSVFile : 'Kun kommaseparerede filer (.csv) understøttes på nuværende tidspunkt.',
      invalidCoord : 'Positionsfelter er ugyldige. Kontrollér .csv-filen.',
      tooManyRecords : 'Beklager, ikke mere end ${0} poster på nuværende tidspunkt.'
    },
    results : {
      csvLoaded : "${0} poster fra CSV-filen er blevet indlæst",
      recordsPlotted : "${0}/${1} poster er blevet lokaliseret på kortet",
      recordsEnriched : "${0}/${1} behandlet, ${2} beriget op imod ${3}",
      recordsError : "${0} poster indeholdt fejl",
      recordsErrorList : "Række ${0} har et problem",
      label: "CSV-resultater"
    }
  })
);
