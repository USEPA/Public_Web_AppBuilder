define(
   ({
    _widgetLabel: "Editor attributi batch",
    widgetIntroSelectByArea: "Utilizzare uno degli strumenti sottostanti per creare un insieme selezionato di feature da aggiornare.  Se la riga è <font class=\'maxRecordInIntro\'>evidenziata</font>, è stato superato il numero massimo di record.",
    widgetIntroSelectByFeature: "Utilizzare lo strumento sottostante per selezionare una feature dal layer <font class=\'layerInIntro\'>${0}</font>.  Questa feature verrà utilizzata per selezionare e aggiornare tutte le feature che intersecano.  Se la riga è <font class=\'maxRecordInIntro\'>evidenziata</font>, è stato superato il numero massimo di record.",
    widgetIntroSelectByFeatureQuery: "Utilizzare lo strumento sottostante per selezionare una feature da <font class=\'layerInIntro\'>${0}</font>.  Questo attributo <font class=\'layerInIntro\'>${1}</font> della feature verrà utilizzato per interrogare i layer sottostanti e aggiornare le feature risultanti.  Se la riga è <font class=\'maxRecordInIntro\'>evidenziata</font>, è stato superato il numero massimo di record.",
    widgetIntroSelectByQuery: "Immettere un valore per creare un set di selezione.  Se la riga è <font class=\'maxRecordInIntro\'>evidenziata</font>, è stato superato il numero massimo di record.",
    layerTable: {
      colLabel: "Nome layer",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Nessun layer modificabile configurato",
    editorPopupTitle: "Editor attributi batch",
    editorPopupSaveBtn: "Salva",
    editorPopupMultipleValues: "",
    clear: "Azzera",
    featuresUpdated: "${0} / ${1} feature aggiornate",
    featuresSelected: "${0} feature selezionate",
    featuresSkipped: "Ignorate",
    search: "Ricerca",
    queryInput: "Immettere valore per l\'interrogazione",
    noFilterTip: "Se non si definisce l\\'espressione di filtro, questa attività di interrogazione restituirà tutte le feature presenti nell\\'origine dati specificata.",
    setFilterTip: "Impostare il filtro correttamente.",
    filterPopup: "Filtra layer",
    cancel: "Annulla",
    ok: "OK",
    drawBox: {
      point: "Punto",
      line: "Linea",
      polyline: "Polilinea",
      freehandPolyline: "Polilinea a mano libera",
      extent: "Estensione",
      polygon: "Poligono",
      freehandPolygon: "Poligono a mano libera",
      clear: "Azzera",
      addPointToolTip: "Fare clic per selezionare quest\'area",
      addShapeToolTip: "Disegnare una forma per selezionare le feature",
      freehandToolTip: "Premere e tenere premuto per disegnare una forma per selezionare feature.",
      startToolTip: "Disegnare una forma per selezionare le feature"
    },
    errors: {
      layerNotFound: "Impossibile trovare il layer ${0} con ID ${1} nella mappa. È possibile che la mappa sia stata modificata dalla configurazione dei widget",
      queryNullID: "La feature di ${0} ha restituito un ID non valido",
      noSelectedLayers: "Nessun layer selezionato con record da aggiornare",
      inputValueError: "Valore non valido nel modulo"
    }
  })
);
