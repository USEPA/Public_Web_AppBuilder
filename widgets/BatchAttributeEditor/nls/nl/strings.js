define(
   ({
    _widgetLabel: "Batch Attribute Editor",
    widgetIntroSelectByArea: "Gebruik een van de onderstaande hulpmiddelen om een geselecteerde reeks te actualiseren objecten te creëren.  Als de rij <font class=\'maxRecordInIntro\'>gemarkeerd</font> is, is het maximum aantal records overschreden.",
    widgetIntroSelectByFeature: "Gebruik onderstaand hulpmiddel om een object te selecteren van <font class=\'layerInIntro\'>${0}</font> laag.  Dit object zal gebruikt worden om alle kruisende objecten te selecteren en actualiseren.  Als de rij <font class=\'maxRecordInIntro\'>gemarkeerd</font> is, is het maximum aantal records overschreden.",
    widgetIntroSelectByFeatureQuery: "Gebruik onderstaand hulpmiddel om een object te selecteren van <font class=\'layerInIntro\'>${0}</font>.  Het <font class=\'layerInIntro\'>${1}</font> attribuut van dit object zal gebruikt worden om alle onderstaande lagen te doorzoeken en de resulterende objecten te actualiseren.  Als de rij <font class=\'maxRecordInIntro\'>gemarkeerd</font> is, is het maximum aantal records overschreden.",
    widgetIntroSelectByQuery: "Voer een waarde in om een selectiereeks te creëren.  Als de rij <font class=\'maxRecordInIntro\'>gemarkeerd</font> is, is het maximum aantal records overschreden.",
    layerTable: {
      colLabel: "Laagnaam",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Geen bewerkbare lagen geconfigureerd",
    editorPopupTitle: "Batch Attribute Editor",
    editorPopupSaveBtn: "Opslaan",
    editorPopupMultipleValues: "",
    clear: "Wissen",
    featuresUpdated: "${0} / ${1} object(en) geactualiseerd",
    featuresSelected: "${0} object(en) geselecteerd",
    featuresSkipped: "Omgeleid",
    search: "Zoeken",
    queryInput: "Voer querywaarde in",
    noFilterTip: "Zonder filterexpressie zal deze querytaak alle functies in de opgegeven gegevensbron weergeven.",
    setFilterTip: "Stel het filter correct in.",
    filterPopup: "Filter laag",
    cancel: "Annuleren",
    ok: "OK",
    drawBox: {
      point: "Punt",
      line: "Lijn",
      polyline: "Polylijn",
      freehandPolyline: "Polylijn in vrije stijl",
      extent: "Extent",
      polygon: "Vlak",
      freehandPolygon: "Veelhoek in vrije stijl",
      clear: "Wissen",
      addPointToolTip: "Klik om in dit gebied te selecteren",
      addShapeToolTip: "Teken een vorm om objecten te selecteren",
      freehandToolTip: "Houd ingedrukt om een vorm te tekenen om objecten te selecteren",
      startToolTip: "Teken een vorm om objecten te selecteren"
    },
    errors: {
      layerNotFound: "Laag ${0} met ID ${1} werd niet gevonden in de kaart, de kaart is mogelijk gewijzigd sinds de configuratie van de widget",
      queryNullID: "Het object van ${0} gaf een ongeldige ID",
      noSelectedLayers: "Geen geselecteerde lagen met te actualiseren records",
      inputValueError: "Ongeldige waarde in de vorm"
    }
  })
);
