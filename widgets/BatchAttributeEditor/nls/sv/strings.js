define(
   ({
    _widgetLabel: "Batchattributredigeraren",
    widgetIntroSelectByArea: "Använd ett av verktygen nedan för att skapa ett urval geoobjekt som ska uppdateras. Om raden är <font class=\'maxRecordInIntro\'>markerad</font>, har du överskridit det högsta antalet tillåtna poster.",
    widgetIntroSelectByFeature: "Använd verktyget ovan för att markera ett geoobjekt från lagret <font class=\'layerInIntro\'>${0}</font>. Geoobjektet används för att markera och uppdatera alla geoobjekt som skär varandra. Om raden är <font class=\'maxRecordInIntro\'>markerad</font>, har du överskridit det högsta antalet tillåtna poster.",
    widgetIntroSelectByFeatureQuery: "Använd verktyget ovan för att markera ett geoobjekt från <font class=\'layerInIntro\'>${0}</font>. Attributet <font class=\'layerInIntro\'>${1}</font> hos geoobjektet används för att skicka frågor till det underliggande lagret och uppdatera resultatgeoobjekten. Om raden är <font class=\'maxRecordInIntro\'>markerad</font>, har du överskridit det högsta antalet tillåtna poster.",
    widgetIntroSelectByQuery: "Ange ett värde för att skapa ett urval. Om raden är <font class=\'maxRecordInIntro\'>markerad</font>, har du överskridit det högsta antalet tillåtna poster.",
    layerTable: {
      colLabel: "Lagernamn",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Inga redigerbara lager har konfigurerats",
    editorPopupTitle: "Batchattributredigeraren",
    editorPopupSaveBtn: "Spara",
    editorPopupMultipleValues: "",
    clear: "Rensa",
    featuresUpdated: "${0}/${1} geoobjekt har uppdaterats",
    featuresSelected: "${0} geoobjekt har markerats",
    featuresSkipped: "Har kringgåtts",
    search: "Sök",
    queryInput: "Ange ett värde för en fråga",
    noFilterTip: "Om inget filteruttryck definierats visar denna frågeuppgift en lista med alla geoobjekt i den angivna datakällan.",
    setFilterTip: "Ange filtret korrekt.",
    filterPopup: "Filtrera lager",
    cancel: "Avbryt",
    ok: "OK",
    drawBox: {
      point: "Punkt",
      line: "Linje",
      polyline: "Polylinje",
      freehandPolyline: "Frihandspolylinje",
      extent: "Utbredning",
      polygon: "Polygon",
      freehandPolygon: "Frihandspolygon",
      clear: "Rensa",
      addPointToolTip: "Klicka om du vill markera området",
      addShapeToolTip: "Markera geoobjekt genom att rita en form",
      freehandToolTip: "Rita en form för att markera geoobjekt genom att trycka",
      startToolTip: "Markera geoobjekt genom att rita en form"
    },
    errors: {
      layerNotFound: "Lagret ${0} med ID:t ${1} hittades inte i kartan. Kartan kan ha ändrats efter att widgeten konfigurerades.",
      queryNullID: "Geoobjektet från ${0} returnerade ett ogiltigt ID",
      noSelectedLayers: "Inga markerade lager har poster att uppdatera",
      inputValueError: "Ogiltigt värde i formuläret"
    }
  })
);
