define(
   ({
    _widgetLabel : "GeoVyhledávání",
    description : "Vyhledejte <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> tabulku </a> nebo ji sem přetáhněte a vizualizujte ji a připojte k ní mapová data.",
    selectCSV : "Vyberte soubor CSV",
    loadingCSV : "Načítání souboru CSV",
    savingCSV: "CSVExport",
    clearResults : "Vyprázdnit",
    downloadResults : "Stahování",
    plotOnly : "Vykreslit pouze body",
    plottingRows : "Vykreslování řádků",
    messages : "Zprávy",
    error : {
      fetchingCSV : 'Došlo k chybě při získávání položek z úložiště CSV: ${0}',
      fileIssue : 'Soubor se nepodařilo zpracovat.',
      notCSVFile : 'Momentálně jsou podporovány pouze soubory oddělené čárkami (.csv).',
      invalidCoord : 'Pole polohového určení jsou neplatná. Zkontrolujte soubor .csv.',
      tooManyRecords : 'Omlouváme se, v tuto chvíli nelze pracovat s více než ${0} záznamy.'
    },
    results : {
      csvLoaded : "Bylo načteno ${0} záznamů ze souboru CSV",
      recordsPlotted : "Na mapě bylo umístěno ${0}/${1} záznamů",
      recordsEnriched : "Zpracováno: ${0}/${1}, obohaceno ${2} oproti ${3}",
      recordsError : "Počet chybných záznamů: ${0}",
      recordsErrorList : "V řádku ${0} se vyskytuje chyba",
      label: "Výsledky CSV"
    }
  })
);
