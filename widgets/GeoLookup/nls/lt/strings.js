define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Suraskite arba nuvilkite <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> skaičiuoklę </a> čia, kad ją vizualizuotumėte ir pritaikytumėte jai žemėlapio duomenis.",
    selectCSV : "Pasirinkti CSV",
    loadingCSV : "Įkeliamas CSV",
    savingCSV: "CSVExport",
    clearResults : "Valyti",
    downloadResults : "Atsiųsti",
    plotOnly : "Vaizduoti tik taškus",
    plottingRows : "Vaizduojamos eilutės",
    messages : "Pranešimai",
    error : {
      fetchingCSV : 'Gaunant elementus iš CSV saugyklos įvyko klaida: ${0}',
      fileIssue : 'Failo nepavyko apdoroti.',
      notCSVFile : 'Šiuo metu palaikomi tik kableliu atskirti (.csv) failai.',
      invalidCoord : 'Vietos laukai yra netinkami. Patikrinkite .csv.',
      tooManyRecords : 'Deja, šiuo metu galimi ne daugiau kaip ${0} įrašai.'
    },
    results : {
      csvLoaded : "Įkelti ${0} įrašai iš CSV failo",
      recordsPlotted : "${0}/${1} įrašai aptikti žemėlapiai",
      recordsEnriched : "${0}/${1} apdorota, ${2} praturtinti ${3}",
      recordsError : "${0} įrašai turi klaidų",
      recordsErrorList : "${0} eilutėje yra nesklandumų",
      label: "CSV rezultatai"
    }
  })
);
