define(
   ({
    page1: {
      selectToolHeader: "Scegliere un metodo per selezionare record per la modalità di aggiornamento batch.",
      selectToolDesc: "Il widget supporta tre metodi per generare un insieme selezionato di record da aggiornare. È possibile scegliere solo uno di questi metodi. Se sono richiesti più metodi, creare una nuova istanza del widget.",
      selectByShape: "Seleziona per area",
      selectBySpatQuery: "Seleziona per feature",
      selectByAttQuery: "Seleziona per feature e feature correlate",
      selectByQuery: "Seleziona per interrogazione",
      toolNotSelected: "Selezionare un metodo di selezione"
    },
    page2: {
      layersToolHeader: "Selezionare i layer da aggiornare e le opzioni degli strumenti di selezione, se disponibili.",
      layersToolDesc: "Il metodo di selezione scelto nella prima pagina verrà utilizzato per selezionare e aggiornare un insieme di layer elencati di seguito.  Se si selezionano più layer, solo i campi modificabili comuni saranno disponibili per l\'aggiornamento.  In base alla scelta dello strumento di selezione, saranno richieste opzioni aggiuntive.",
      layerTable: {
        colUpdate: "Aggiorna",
        colLabel: "Layer",
        colSelectByLayer: "Seleziona per layer",
        colSelectByField: "Campo interrogazione",
        colhighlightSymbol: "Evidenzia simbolo"
      },
      toggleLayers: "Attiva/disattiva la visibilità dei layer all\'apertura e alla chiusura",
      noEditableLayers: "Nessun layer modificabile",
      noLayersSelected: "Selezionare uno o più layer prima di continuare."
    },
    page3: {
      commonFieldsHeader: "Selezionare i campi per la modalità di aggiornamento batch.",
      commonFieldsDesc: "Solo i campi modificabili comuni verranno visualizzati di seguito.  Selezionare i campi che si desidera aggiornare.  Se lo stesso campo di layer diversi dispone di un dominio diverso, verrà visualizzato e utilizzato un solo dominio.",
      noCommonFields: "Nessun campo in comune",
      fieldTable: {
        colEdit: "Modificabile",
        colName: "Nome",
        colAlias: "Alias",
        colAction: "Azione"
      }
    },
    tabs: {
      selection: "Definire tipo di selezione",
      layers: "Definire layer da aggiornare",
      fields: "Definire campi da aggiornare"
    },
    errorOnOk: "Compilare tutti i parametri prima di salvare la configurazione",
    next: "Seguente",
    back: "Indietro",
    save: "Salva simbolo",
    cancel: "Annulla",
    ok: "OK",
    symbolPopup: "Selezione simbolo"
  })
);
