define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Blader naar of Versleep een <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> spreadsheet </a> naar om te visualiseren en kaartgegevens in te sluiten.",
    selectCSV : "Een CSV-bestand selecteren",
    loadingCSV : "CSV-bestand laden",
    savingCSV: "CSVExport",
    clearResults : "Wissen",
    downloadResults : "Downloaden",
    plotOnly : "Alleen plotpunten",
    plottingRows : "Rijen plotten",
    messages : "Berichten",
    error : {
      fetchingCSV : 'Fout bij laden van items uit CSV store: ${0}',
      fileIssue : 'Bestand kon niet worden verwerkt.',
      notCSVFile : 'Op dit moment worden alleen .csv-bestanden ondersteund.',
      invalidCoord : 'Locatievelden zijn ongeldig. Controleer het .csv-bestand.',
      tooManyRecords : 'Het spijt ons, er zijn op dit moment slechts ${0} items.'
    },
    results : {
      csvLoaded : "${0} items uit het CSV-bestand werd geladen",
      recordsPlotted : "${0}/${1} items werden op de kaart gelokaliseerd",
      recordsEnriched : "${0}/${1} verwerkt, ${2} verrijkt t.o.v. ${3}",
      recordsError : "${0} items hadden fouten",
      recordsErrorList : "Rij ${0} heeft een probleem",
      label: "CSV-resultaten"
    }
  })
);
