define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Bläddra till eller dra ett <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'>kalkyblad</a> hit om du vill visualisera det, och addera kartdata till det.",
    selectCSV : "Markera en CSV",
    loadingCSV : "Läser in CSV",
    savingCSV: "CSVExport",
    clearResults : "Rensa",
    downloadResults : "Hämta",
    plotOnly : "Bara plottningspunkter",
    plottingRows : "Plottar rader",
    messages : "Meddelanden",
    error : {
      fetchingCSV : 'Fel vid hämtning av objekt från CSV-lagringen: ${0}',
      fileIssue : 'Filen kunde inte bearbetas.',
      notCSVFile : 'Bara kommaavgränsade filer (.csv) stöds för närvarande.',
      invalidCoord : 'Platsfälten är ogiltiga. Kontrollera .csv-filen.',
      tooManyRecords : 'Tyvärr tillåts inte fler än ${0} poster just nu.'
    },
    results : {
      csvLoaded : "${0} poster från CSV-filen har lästs in",
      recordsPlotted : "${0}/${1} poster har hittats på kartan",
      recordsEnriched : "${0}/${1} bearbetade, ${2} berikade mot ${3}",
      recordsError : "${0} poster innehöll fel",
      recordsErrorList : "Rad ${0} innehåller ett fel",
      label: "CSV-resultat"
    }
  })
);
