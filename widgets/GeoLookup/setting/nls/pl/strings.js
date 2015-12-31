define(
   ({
    settingsHeader : "Skonfiguruj szczegóły widżetu GeoWyszukiwanie",
    settingsDesc : "Wzbogać danymi geograficznymi listę lokalizacji z pliku CSV względem warstw poligonowych na mapie. Wybrane z warstw poligonowych pola są dodane do lokalizacji.",
    settingsLoadingLayers: "Proszę czekać na wczytanie się warstw.",
    settingsConfigureTitle: "Skonfiguruj pola warstwy",
    layerTable : {
      colEnrich : "Wzbogać",
      colLabel : "Warstwa",
      colFieldSelector : "Pola"
    },
    fieldTable : {
      colAppend : "Dodaj",
      colName : "Nazwa",
      colAlias : "Alias",
      colOrder : "Kolejność",
      label : "Sprawdź pole, które chcesz dodać. Wybierz pole, aby zmienić jego alias, określić jego pozycję i sformatować je."
    },
    symbolArea : {
      symbolLabelWithin : 'Wybierz symbol dla lokalizacji wewnątrz:',
      symbolLabelOutside : 'Wybierz symbol dla lokalizacji na zewnątrz:'
    },
    advSettings : {
      label: "Ustawienia zaawansowane",
      latFieldsDesc : "Możliwe nazwy pól dla pola szerokości geograficznej.",
      longFieldsDesc : "Możliwe nazwy pól dla pola długości geograficznej.",
      intersectFieldDesc : "Nazwa pola utworzonego do przechowywania wartości, jeśli wyszukiwanie przetnie warstwę.",
      intersectInDesc : "Wartość do przechowywania, jeśli lokalizacja przetnie poligon.",
      intersectOutDesc : "Wartość do przechowywania, jeśli lokalizacja nie przetnie poligonu.",
      maxRowCount : "Maksymalna liczba rzędów w pliku CSV.",
      cacheNumberDesc : "Próg klastrów punktów dla szybszego przetwarzania.",
      subTitle : "Skonfiguruj wartości dla pliku CSV."
    },
    noPolygonLayers : "Brak warstw poligonowych",
    errorOnOk : "Przed zapisaniem konfiguracji należy wprowadzić wszystkie parametry",
    saveFields : "Zapisz pola",
    cancelFields : "Anuluj pola",
    saveAdv : "Zapisz ustawienia zaawansowane",
    cancelAdv : "Anuluj ustawienia zaawansowane",
    advSettingsBtn : "Ustawienia zaawansowane",
    chooseSymbol: "Wybierz symbol",
    okBtn: "OK",
    cancelBtn: "Anuluj"
  })
);
