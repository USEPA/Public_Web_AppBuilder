define(
   ({
    _widgetLabel: "Batch-Attribut-Editor",
    widgetIntroSelectByArea: "Verwenden Sie eines der nachfolgenden Werkzeuge, um eine ausgewählte Reihe von Features zu erstellen, die aktualisiert werden sollen. Wenn die Zeile <font class=\'maxRecordInIntro\'>hervorgehoben</font> ist, wurde die maximale Anzahl von Datensätzen überschritten.",
    widgetIntroSelectByFeature: "Verwenden Sie das nachfolgende Werkzeug, um ein Feature aus dem <font class=\'layerInIntro\'>${0}</font>-Layer auszuwählen.  Dieses Feature dient zum Auswählen und Aktualisieren aller überschneidenden Features.  Wenn die Zeile <font class=\'maxRecordInIntro\'>hervorgehoben</font> ist, wurde die maximale Anzahl von Datensätzen überschritten.",
    widgetIntroSelectByFeatureQuery: "Verwenden Sie das nachfolgende Werkzeug, um ein Feature aus <font class=\'layerInIntro\'>${0}</font> auszuwählen.  Das <font class=\'layerInIntro\'>${1}</font>-Attribut dieses Features wird verwendet, um die nachfolgenden Layer abzufragen und die resultierenden Features zu aktualisieren.  Wenn die Zeile <font class=\'maxRecordInIntro\'>hervorgehoben</font> ist, wurde die maximale Anzahl von Datensätzen überschritten.",
    widgetIntroSelectByQuery: "Geben Sie einen Wert ein, um einen Auswahlsatz zu erstellen.  Wenn die Zeile <font class=\'maxRecordInIntro\'>hervorgehoben</font> ist, wurde die maximale Anzahl von Datensätzen überschritten.",
    layerTable: {
      colLabel: "Layer-Name",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Es wurden keine Layer konfiguriert.",
    editorPopupTitle: "Batch-Attribut-Editor",
    editorPopupSaveBtn: "Speichern",
    editorPopupMultipleValues: "",
    clear: "Auswahl aufheben",
    featuresUpdated: "${0} / ${1} Feature(s) wurde(n) aktualisiert",
    featuresSelected: "${0} Feature(s) wurde(n) ausgewählt",
    featuresSkipped: "Umgangen",
    search: "Suche",
    queryInput: "Abzufragenden Wert eingeben",
    noFilterTip: "Dieser Abfrage-Task listet alle Features in der angegebenen Datenquelle ohne definierten Filterausdruck auf.",
    setFilterTip: "Legen Sie den Filter ordnungsgemäß fest.",
    filterPopup: "Layer filtern",
    cancel: "Abbrechen",
    ok: "OK",
    drawBox: {
      point: "Punkt",
      line: "Linie",
      polyline: "Polylinie",
      freehandPolyline: "Freihand-Polylinie",
      extent: "Ausdehnung",
      polygon: "Polygon",
      freehandPolygon: "Freihand-Polygon",
      clear: "Auswahl aufheben",
      addPointToolTip: "Klicken Sie hier, um in diesem Bereich auszuwählen",
      addShapeToolTip: "Zeichnen Sie ein Shape, um Features auszuwählen",
      freehandToolTip: "Halten Sie die Maustaste gedrückt, um ein Shape zum Auswählen von Features zu zeichnen",
      startToolTip: "Zeichnen Sie ein Shape, um Features auszuwählen"
    },
    errors: {
      layerNotFound: "Der Layer ${0} mit der ID ${1} wurde nicht auf der Karte gefunden. Die Karte wurde möglicherweise nach der Widget-Konfiguration geändert",
      queryNullID: "Das Feature aus ${0} gab eine ungültige ID zurück",
      noSelectedLayers: "Keine ausgewählten Layer mit zu aktualisierenden Datensätzen",
      inputValueError: "Ungültiger Wert im Formular"
    }
  })
);
