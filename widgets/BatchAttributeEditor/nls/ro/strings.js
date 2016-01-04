define(
   ({
    _widgetLabel: "Editor atribute în masă",
    widgetIntroSelectByArea: "Utilizaţi unul dintre instrumentele de mai jos pentru a crea un set de obiecte spaţiale care vor fi actualizate.  Dacă rândul este <font class=\'maxRecordInIntro\'>evidenţiat</font>, numărul maxim de înregistrări a fost depăşit.",
    widgetIntroSelectByFeature: "Utilizaţi instrumentul de mai jos pentru a selecta un obiect spaţial din stratul tematic <font class=\'layerInIntro\'>${0}</font>.  Acest obiect spaţial va fi utilizat pentru a selecta şi actualiza toate obiectele spaţiale care se intersectează.  Dacă rândul este <font class=\'maxRecordInIntro\'>evidenţiat</font>, numărul maxim de înregistrări a fost depăşit.",
    widgetIntroSelectByFeatureQuery: "Utilizaţi instrumentul de mai jos pentru a selecta un obiect spaţial din <font class=\'layerInIntro\'>${0}</font>.  Atributul <font class=\'layerInIntro\'>${1}</font> al acestei caracteristici va fi utilizat pentru a interoga straturile tematice de mai jos şi pentru a actualiza obiectele spaţiale rezultate.  Dacă rândul este <font class=\'maxRecordInIntro\'>evidenţiat</font>, numărul maxim de înregistrări a fost depăşit.",
    widgetIntroSelectByQuery: "Introduceţi o valoare pentru a crea un set de selecţii.  Dacă rândul este <font class=\'maxRecordInIntro\'>evidenţiat</font>, numărul maxim de înregistrări a fost depăşit.",
    layerTable: {
      colLabel: "Nume strat tematic",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Niciun strat tematic editabil configurat",
    editorPopupTitle: "Editor atribute în masă",
    editorPopupSaveBtn: "Salvare",
    editorPopupMultipleValues: "",
    clear: "Golire",
    featuresUpdated: "${0} / ${1} obiecte spaţiale actualizate",
    featuresSelected: "${0} obiecte spaţiale selectate",
    featuresSkipped: "Ignorat",
    search: "Căutare",
    queryInput: "Introduceţi o valoare care va fi interogată",
    noFilterTip: "Fără a avea expresia de filtrare definită, această operaţie de interogare va lista toate obiectele spaţiale din sursa de date specificată.",
    setFilterTip: "Setaţi corect filtrul.",
    filterPopup: "Filtrare strat tematic",
    cancel: "Anulare",
    ok: "OK",
    drawBox: {
      point: "Punct",
      line: "Linie",
      polyline: "Linie poligonală",
      freehandPolyline: "Linie poligonală trasată manual",
      extent: "Extindere",
      polygon: "Poligon",
      freehandPolygon: "Poligon trasat manual",
      clear: "Golire",
      addPointToolTip: "Faceţi clic pentru a selecta în această zonă",
      addShapeToolTip: "Trasaţi o formă pentru a selecta obiectele spaţiale",
      freehandToolTip: "Apăsaţi şi menţineţi apăsat pentru a trasa o formă pentru a selecta obiectele spaţiale",
      startToolTip: "Trasaţi o formă pentru a selecta obiectele spaţiale"
    },
    errors: {
      layerNotFound: "Stratul tematic ${0} cu ID-ul ${1} nu a fost găsit pe hartă, este posibil ca harta să se fi schimbat de la configurarea widgeturilor",
      queryNullID: "Stratul tematic din ${0} a returnat un ID nevalid",
      noSelectedLayers: "Niciun strat tematic selectat cu înregistrări de actualizat",
      inputValueError: "Valoare nevalidă în formular"
    }
  })
);
