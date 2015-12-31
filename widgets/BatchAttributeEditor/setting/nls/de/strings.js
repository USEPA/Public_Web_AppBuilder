define(
   ({
    page1: {
      selectToolHeader: "Legen Sie eine Methode zum Auswählen von Datensätzen für die Batch-Aktualisierung fest.",
      selectToolDesc: "Das Widget unterstützt drei Methoden zum Erstellen einer ausgewählten Gruppe von Datensätzen, die aktualisiert werden sollen. Sie können nur eine Methode auswählen. Wenn Sie mehrere Methoden benötigen, erstellen Sie eine neue Instanz des Widgets.",
      selectByShape: "Nach Bereich auswählen",
      selectBySpatQuery: "Nach Feature auswählen",
      selectByAttQuery: "Nach Feature & zugehörigen Features auswählen",
      selectByQuery: "Nach Abfrage auswählen",
      toolNotSelected: "Wählen Sie eine Auswahlmethode aus"
    },
    page2: {
      layersToolHeader: "Wählen Sie die zu aktualisierenden Layer und die Auswahlwerkzeugoptionen aus, falls vorhanden.",
      layersToolDesc: "Mit der auf Seite eins ausgewählten Methode werden die verschiedenen unten aufgelisteten Layer ausgewählt und aktualisiert.  Wenn Sie mehrere Layer aktivieren, können nur die allgemeinen editierbaren Felder aktualisiert werden.  Je nachdem, welches Auswahlwerkzeug Sie auswählen, sind zusätzliche Optionen erforderlich.",
      layerTable: {
        colUpdate: "Aktualisieren",
        colLabel: "Layer",
        colSelectByLayer: "Nach Layer auswählen",
        colSelectByField: "Abfrage-Feld",
        colhighlightSymbol: "Hervorhebungssymbol"
      },
      toggleLayers: "Layer-Sichtbarkeit beim Öffnen und Schließen umschalten",
      noEditableLayers: "Keine editierbaren Layer",
      noLayersSelected: "Wählen Sie mindestens einen Layer aus, bevor Sie den Vorgang fortsetzen"
    },
    page3: {
      commonFieldsHeader: "Wählen Sie die Felder für die Batch-Aktualisierung aus.",
      commonFieldsDesc: "Nachfolgend werden nur allgemeine editierbare Felder angezeigt.  Wählen Sie die Felder aus, die Sie aktualisieren möchten.  Wenn dasselbe Feld aus verschiedenen Layern eine andere Domäne hat, wird nur eine Domäne angezeigt und verwendet.",
      noCommonFields: "Keine allgemeinen Felder",
      fieldTable: {
        colEdit: "Editierbar",
        colName: "Name",
        colAlias: "Alias",
        colAction: "Aktion"
      }
    },
    tabs: {
      selection: "Auswahltyp definieren",
      layers: "Zu aktualisierende(n) Layer definieren",
      fields: "Zu aktualisierende(s) Feld(er) definieren"
    },
    errorOnOk: "Füllen Sie alle Parameter aus, bevor Sie die Konfiguration speichern",
    next: "Nächste(r)",
    back: "Zurück",
    save: "Symbol speichern",
    cancel: "Abbrechen",
    ok: "OK",
    symbolPopup: "Symbolauswahl"
  })
);
