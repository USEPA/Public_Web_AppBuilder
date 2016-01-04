define(
   ({
    _widgetLabel : "Geocăutare",
    description : "Navigaţi la sau trageţi o <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> foaie de calcul </a> aici pentru a o vizualiza şi pentru a adăuga date de hartă la aceasta.",
    selectCSV : "Selectare CSV",
    loadingCSV : "Se încarcă CSV",
    savingCSV: "Export CSV",
    clearResults : "Golire",
    downloadResults : "Descărcare",
    plotOnly : "Doar puncte reprezentate grafic",
    plottingRows : "Se reprezintă grafic rândurile",
    messages : "Mesaje",
    error : {
      fetchingCSV : 'Eroare la extragerea elementelor din depozitul de fişiere CSV: ${0}',
      fileIssue : 'Fişierul nu a putut fi procesat.',
      notCSVFile : 'Doar fişierele delimitate prin virgule (.csv) sunt acceptate momentan.',
      invalidCoord : 'Câmpurile pentru locaţie nu sunt valide. Verificaţi fişierul .csv.',
      tooManyRecords : 'Ne pare rău, maximum ${0} înregistrări momentan.'
    },
    results : {
      csvLoaded : "Au fost încărcate ${0} înregistrări din fişierul CSV",
      recordsPlotted : "${0}/${1} înregistrări au fost localizate pe hartă",
      recordsEnriched : "${0}/${1} procesate, ${2} îmbogăţite faţă de ${3}",
      recordsError : "${0} înregistrări au avut erori",
      recordsErrorList : "Rândul ${0} are o problemă",
      label: "Rezultate CSV"
    }
  })
);
