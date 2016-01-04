define(
   ({
    _widgetLabel: "Batch Attribute Editor",
    widgetIntroSelectByArea: "Bruk et av verktøyene nedenfor til å opprette et utvalgt sett med geoobjekter som skal oppdateres. Hvis raden er <font class=\'maxRecordInIntro\'>uthevet</font>, er maksimum antall poster overskredet.",
    widgetIntroSelectByFeature: "Bruk verktøyet nedenfor til å velge et geoobjekt fra <font class=\'layerInIntro\'>${0}</font>-laget.  Dette geoobjektet brukes til å velge og oppdatere alle kryssende geoobjekter. Hvis raden er <font class=\'maxRecordInIntro\'>uthevet</font>, er maksimum antall poster overskredet.",
    widgetIntroSelectByFeatureQuery: "Bruk verktøyet nedenfor til å velge et geoobjekt fra <font class=\'layerInIntro\'>${0}</font>-laget.   Geoobjektets <font class=\'layerInIntro\'>${1}</font>-attributt brukes til å spørre lagene nedenfor og oppdatere de resulterende geoobjektene. Hvis raden er <font class=\'maxRecordInIntro\'>uthevet</font>, er maksimum antall poster overskredet.",
    widgetIntroSelectByQuery: "Skriv inn en verdi for å opprette et utvalg. Hvis raden er <font class=\'maxRecordInIntro\'>uthevet</font>, er maksimum antall poster overskredet.",
    layerTable: {
      colLabel: "Lagnavn",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Ingen redigerbare lag er konfigurert",
    editorPopupTitle: "Batch Attribute Editor",
    editorPopupSaveBtn: "Lagre",
    editorPopupMultipleValues: "",
    clear: "Tøm",
    featuresUpdated: "${0} / ${1} geoobjekt(er) er oppdatert",
    featuresSelected: "${0} geoobjekt(er) er valgt",
    featuresSkipped: "Forbigått",
    search: "Søke",
    queryInput: "Angi verdien det skal spørres etter",
    noFilterTip: "Uten definert filteruttrykk viser denne spørringoppgaven alle geoobjekter i den angitte datakilden.",
    setFilterTip: "Angi filteret på riktig måte.",
    filterPopup: "Filtrer kartlag",
    cancel: "Avbryt",
    ok: "OK",
    drawBox: {
      point: "Punkt",
      line: "Linje",
      polyline: "Polylinje",
      freehandPolyline: "Frihåndspolylinje",
      extent: "Omfang",
      polygon: "Polygon",
      freehandPolygon: "Frihåndspolygon",
      clear: "Tøm",
      addPointToolTip: "Klikk for å velge i dette området",
      addShapeToolTip: "Tegn en form for å velge geoobjekter",
      freehandToolTip: "Trykk og hold for å tegne en form for å velge geoobjekter",
      startToolTip: "Tegn en form for å velge geoobjekter"
    },
    errors: {
      layerNotFound: "Finner ikke laget ${0} med ID-en ${1} i kartet. Kartet kan ha blitt endret etter widgetens godkjenning.",
      queryNullID: "Geoobjektet fra ${0} returnerte en ugyldig ID",
      noSelectedLayers: "Ingen valgte lag med geoobjekter å oppdatere",
      inputValueError: "Ugyldig verdi i skjemaet"
    }
  })
);
