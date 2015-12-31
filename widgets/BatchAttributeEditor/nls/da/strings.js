define(
   ({
    _widgetLabel: "Batch-attribut-editor",
    widgetIntroSelectByArea: "Brug et af værktøjerne nedenfor til at oprette et udvalgt sæt objekter, der skal opdateres. Hvis rækken er <font class=\'maxRecordInIntro\'>fremhævet</font>, er det maksimale antal poster blevet overskredet.",
    widgetIntroSelectByFeature: "Brug værktøjet nedenfor til at vælge et objekt fra <font class=\'layerInIntro\'>${0}</font> laget. Dette objekt vil blive brugt til at vælge og opdatere alle objekter, der gennemskæres. Hvis rækken er <font class=\'maxRecordInIntro\'>fremhævet</font>, er det maksimale antal poster blevet overskredet.",
    widgetIntroSelectByFeatureQuery: "Brug værktøjet nedenfor til at vælge et objekt fra <font class=\'layerInIntro\'>${0}</font>. Dette objekts <font class=\'layerInIntro\'>${1}</font>-attribut vil blive brugt til at forespørge på lagene nedenfor og opdatere de resulterende objekter. Hvis rækken er <font class=\'maxRecordInIntro\'>fremhævet</font>, er det maksimale antal poster blevet overskredet.",
    widgetIntroSelectByQuery: "Angiv en værdi for at oprette et markeringssæt. Hvis rækken er <font class=\'maxRecordInIntro\'>fremhævet</font>, er det maksimale antal poster blevet overskredet.",
    layerTable: {
      colLabel: "Navn på lag",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Ingen redigérbare lag er konfigureret",
    editorPopupTitle: "Batch-attribut-editor",
    editorPopupSaveBtn: "Gem",
    editorPopupMultipleValues: "",
    clear: "Ryd",
    featuresUpdated: "${0} / ${1} objekt(er) opdateret",
    featuresSelected: "${0} objekt(er) valgt",
    featuresSkipped: "Tilsidesat",
    search: "Search",
    queryInput: "Angiv en værdi, der skal forespørges om",
    noFilterTip: "Defineres der ikke et filterudtryk, viser denne forespørgsel alle objekter i den angivne datakilde.",
    setFilterTip: "Angiv filteret korrekt.",
    filterPopup: "Filtrér lag",
    cancel: "Annullér",
    ok: "OK",
    drawBox: {
      point: "Punkt",
      line: "Linje",
      polyline: "Polylinje",
      freehandPolyline: "Frihåndspolylinje",
      extent: "Udstrækning",
      polygon: "Polygon",
      freehandPolygon: "Frihåndspolygon",
      clear: "Ryd",
      addPointToolTip: "Klik for at vælge i dette område",
      addShapeToolTip: "Tegn en form for at vælge objekter",
      freehandToolTip: "Tryk og hold nede for at tegne en form for at vælge objekter",
      startToolTip: "Tegn en form for at vælge objekter"
    },
    errors: {
      layerNotFound: "Laget ${0} med id\'et ${1} blev ikke fundet på kortet, kortlaget kan være ændret siden widget-konfigurationen",
      queryNullID: "Objektet fra ${0} returnerede et ugyldigt id",
      noSelectedLayers: "Ingen valgte lag med poster, der skal opdateres",
      inputValueError: "Ugyldig værdi i formularen"
    }
  })
);
