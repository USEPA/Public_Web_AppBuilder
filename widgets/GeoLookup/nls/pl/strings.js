define(
   ({
    _widgetLabel : "GeoWyszukiwanie",
    description : "Znajdź lub przeciągnij tutaj <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'>arkusz kalkulacyjny</a>, aby dokonać wizualizacji oraz dodać do niego dane mapy.",
    selectCSV : "Wybierz plik CSV",
    loadingCSV : "Wczytywanie pliku CSV",
    savingCSV: "Eksportuj plik CSV",
    clearResults : "Wyczyść",
    downloadResults : "Pobierz",
    plotOnly : "Tylko umieść punkty",
    plottingRows : "Umieszczanie rzędów",
    messages : "Komunikaty",
    error : {
      fetchingCSV : 'Błąd podczas pobierania elementów z magazynu CSV: ${0}',
      fileIssue : 'Przetworzenie pliku nie powiodło się.',
      notCSVFile : 'Aktualnie obsługiwane są tylko pliki z danymi rozdzielanymi przecinkami (.csv).',
      invalidCoord : 'Nieprawidłowe pola docelowe. Proszę sprawdzić plik .csv.',
      tooManyRecords : 'Niestety nie można użyć większej liczby rekordów niż ${0}.'
    },
    results : {
      csvLoaded : "Liczba rekordów wczytana z pliku CSV: ${0}",
      recordsPlotted : "Liczba rekordów zlokalizowana na mapie: ${0}/${1}",
      recordsEnriched : "Przetworzono: ${0}/${1}, ${2} wzbogacono względem ${3}",
      recordsError : "Liczba rekordów z błędami: ${0}",
      recordsErrorList : "Wystąpił problem w rzędzie ${0}",
      label: "Wyniki CSV"
    }
  })
);
