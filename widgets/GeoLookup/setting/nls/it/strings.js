define(
   ({
    settingsHeader : "Imposta i dettagli per il widget Ricerca geografica",
    settingsDesc : "Aggiunti dati geografici a un elenco di posizioni di un file CSV rispetto a layer poligono sulla mappa. I campi selezionati da layer poligono vengono aggiunti alle posizioni.",
    settingsLoadingLayers: "Attendere. Caricamento layer in corso...",
    settingsConfigureTitle: "Configura campi layer",
    layerTable : {
      colEnrich : "Aggiungi dati",
      colLabel : "Layer",
      colFieldSelector : "Campi"
    },
    fieldTable : {
      colAppend : "Accoda",
      colName : "Nome",
      colAlias : "Alias",
      colOrder : "Ordina",
      label : "Selezionare il campo da aggiungere. Selezionare un campo per modificarne l\'alias, ordinarlo e formattarlo."
    },
    symbolArea : {
      symbolLabelWithin : 'Selezionare il simbolo per posizioni interne:',
      symbolLabelOutside : 'Selezionare il simbolo per posizioni esterne:'
    },
    advSettings : {
      label: "Impostazioni avanzate",
      latFieldsDesc : "Nomi campo possibili per campo Latitudine.",
      longFieldsDesc : "Nomi campo possibili per campo Longitudine.",
      intersectFieldDesc : "Il nome del campo creato per memorizzare valori se la ricerca ha intersecato un layer.",
      intersectInDesc : "Valore da memorizzare quando la posizione ha intersecato un poligono.",
      intersectOutDesc : "Valore da memorizzare quando la posizione non ha intersecato un poligono.",
      maxRowCount : "Numero massimo di righe nel file CSV.",
      cacheNumberDesc : "Soglia cluster di punti per elaborazione più rapida.",
      subTitle : "Impostare valori per file CSV."
    },
    noPolygonLayers : "Nessun layer poligono",
    errorOnOk : "Compilare tutti i parametri prima di salvare la configurazione",
    saveFields : "Salva campi",
    cancelFields : "Annulla campi",
    saveAdv : "Salva impostazioni avanzate",
    cancelAdv : "Annulla impostazioni avanzate",
    advSettingsBtn : "Impostazioni avanzate",
    chooseSymbol: "Scegli un simbolo",
    okBtn: "OK",
    cancelBtn: "Annulla"
  })
);
