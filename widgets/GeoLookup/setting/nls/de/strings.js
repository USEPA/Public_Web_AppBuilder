define(
   ({
    settingsHeader : "Legen Sie die Details für das GeoLookup-Widget fest",
    settingsDesc : "Reichern Sie eine Positionsliste aus einer CSV-Datei mit Polygon-Layern auf der Karte mit Geodaten an. Aus den Polygon-Layern ausgewählte Felder werden an die Positionen angefügt.",
    settingsLoadingLayers: "Bitte warten. Die Layer werden geladen.",
    settingsConfigureTitle: "Layer-Felder konfigurieren",
    layerTable : {
      colEnrich : "Anreichern",
      colLabel : "Layer",
      colFieldSelector : "Felder"
    },
    fieldTable : {
      colAppend : "Anhängen",
      colName : "Name",
      colAlias : "Alias",
      colOrder : "Reihenfolge",
      label : "Aktivieren Sie das Feld, das Sie anhängen möchten. Wählen Sie ein Feld aus, um dessen Alias, Sortierung und Formatierung zu ändern."
    },
    symbolArea : {
      symbolLabelWithin : 'Wählen Sie das Symbol für Positionen innerhalb von:',
      symbolLabelOutside : 'Wählen Sie das Symbol für Positionen außerhalb von:'
    },
    advSettings : {
      label: "Erweiterte Einstellungen",
      latFieldsDesc : "Mögliche Feldnamen für das Feld \"Breitengrad\".",
      longFieldsDesc : "Mögliche Feldnamen für das Feld \"Längengrad\".",
      intersectFieldDesc : "Der Name des erstellen Feldes zur Speicherung des Wertes, wenn das Suchergebnis einen Layer überschneidet.",
      intersectInDesc : "Zu speichernder Wert, wenn die Position ein Polygon überschneidet.",
      intersectOutDesc : "Zu speichernder Wert, wenn die Position kein Polygon überschneidet.",
      maxRowCount : "Die maximale Zeilenanzahl in der CSV-Datei.",
      cacheNumberDesc : "Punktcluster-Grenzwert für schnelle Verarbeitung.",
      subTitle : "Werte für CSV-Datei festlegen."
    },
    noPolygonLayers : "Keine Polygon-Layer",
    errorOnOk : "Füllen Sie alle Parameter aus, bevor Sie die Konfiguration speichern",
    saveFields : "Felder speichern",
    cancelFields : "Felder abbrechen",
    saveAdv : "Erweiterte Einstellungen speichern",
    cancelAdv : "Erweiterte Einstellungen abbrechen",
    advSettingsBtn : "Erweiterte Einstellungen",
    chooseSymbol: "Ein Symbol auswählen",
    okBtn: "OK",
    cancelBtn: "Abbrechen"
  })
);
