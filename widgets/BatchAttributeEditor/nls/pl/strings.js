define(
   ({
    _widgetLabel: "Edytor atrybutów wsadowych",
    widgetIntroSelectByArea: "Użyj jednego z poniższych narzędzi, aby utworzyć wybrany zestaw obiektów do uaktualnienia. Jeżeli dany rząd jest <font class=\'maxRecordInIntro\'>podświetlony</font>, oznacza to, że przekroczona została maksymalna liczba rekordów.",
    widgetIntroSelectByFeature: "Użyj poniższego narzędzia, aby wybrać obiekt z warstwy <font class=\'layerInIntro\'>${0}</font>. Będzie służyć do wyboru i aktualizacji wszystkich przecinających się obiektów. Jeżeli dany rząd jest <font class=\'maxRecordInIntro\'>podświetlony</font>, oznacza to, że przekroczona została maksymalna liczba rekordów.",
    widgetIntroSelectByFeatureQuery: "Użyj poniższego narzędzia, aby wybrać obiekt z warstwy <font class=\'layerInIntro\'>${0}</font>. Atrybut <font class=\'layerInIntro\'>${1}</font> tego obiektu będzie użyty do wprowadzenia zapytań dla poniższych warstw i aktualizacji obiektów, które zostaną wyświetlone w wynikach. Jeżeli dany rząd jest <font class=\'maxRecordInIntro\'>podświetlony</font>, oznacza to, że przekroczona została maksymalna liczba rekordów.",
    widgetIntroSelectByQuery: "Wprowadź wartość, aby utworzyć wybrany zestaw. Jeżeli dany rząd jest <font class=\'maxRecordInIntro\'>podświetlony</font>, oznacza to, że przekroczona została maksymalna liczba rekordów.",
    layerTable: {
      colLabel: "Nazwa warstwy tematycznej",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Brak skonfigurowanych edytowalnych warstw",
    editorPopupTitle: "Edytor atrybutów wsadowych",
    editorPopupSaveBtn: "Zapisz",
    editorPopupMultipleValues: "",
    clear: "Wyczyść",
    featuresUpdated: "Uaktualnione obiekty: ${0} / ${1}",
    featuresSelected: "Wybrane obiekty: ${0}",
    featuresSkipped: "Pominięte",
    search: "Szukaj",
    queryInput: "Wprowadź wartość do zapytania",
    noFilterTip: "Jeżeli wyrażenie filtru nie zostanie zdefiniowane, zadanie zapytania zwróci wszystkie obiekty w podanym źródle danych.",
    setFilterTip: "Skonfiguruj poprawnie filtr.",
    filterPopup: "Filtruj warstwę",
    cancel: "Anuluj",
    ok: "OK",
    drawBox: {
      point: "Punkt",
      line: "Linia",
      polyline: "Polilinia",
      freehandPolyline: "Polilinia odręczna",
      extent: "Zasięg",
      polygon: "Wielokąt",
      freehandPolygon: "Poligon odręczny",
      clear: "Wyczyść",
      addPointToolTip: "Kliknij, aby wybrać na tym obszarze",
      addShapeToolTip: "Aby wybrać obiekty, zaznacz obszar",
      freehandToolTip: "Naciśnij i przytrzymaj, aby narysować kształt w celu zaznaczenia obiektów",
      startToolTip: "Aby wybrać obiekty, zaznacz obszar"
    },
    errors: {
      layerNotFound: "Nie znaleziono na mapie warstwy ${0} z identyfikatorem ${1}; od chwili konfiguracji widżetu mapa mogła się zmienić",
      queryNullID: "Obiekt z ${0} zwrócił nieprawidłowy identyfikator",
      noSelectedLayers: "Brak wybranych warstw z rekordami do uaktualnienia",
      inputValueError: "Nieprawidłowa wartość w formularzu"
    }
  })
);
