define(
   ({
    settingsHeader : "Ange detaljer för widgeten GeoLookup",
    settingsDesc : "Geoberika en lista med platser från en CSV-fil mot polygonlager på en karta. Markerade fält från polygonlager läggs till bland platserna.",
    settingsLoadingLayers: "Vänta medan lagren läses in.",
    settingsConfigureTitle: "Konfigurera lagerfält",
    layerTable : {
      colEnrich : "Enrich",
      colLabel : "Lager",
      colFieldSelector : "Fält"
    },
    fieldTable : {
      colAppend : "Lägg till",
      colName : "Namn",
      colAlias : "Alias",
      colOrder : "Ordning",
      label : "Kontrollera det fält som du vill lägga till. Markera ett fält om du vill ändra dess alias, ordna det och formatera det."
    },
    symbolArea : {
      symbolLabelWithin : 'Markera symbolen för platser inom:',
      symbolLabelOutside : 'Markera symbolen för platser utanför:'
    },
    advSettings : {
      label: "Avancerade inställningar",
      latFieldsDesc : "Möjliga fältnamn för fältet Latitud.",
      longFieldsDesc : "Möjliga fältnamn för fältet Longitud.",
      intersectFieldDesc : "Namnet på det fält som skapats för att lagra värden om sökningen skär ett lager.",
      intersectInDesc : "Värde som ska lagras när platsen skär en polygon.",
      intersectOutDesc : "Värde som ska lagras när platsen inte skär en polygon.",
      maxRowCount : "Maximalt antal rader i CSV-filen.",
      cacheNumberDesc : "Tröskel för punktkluster för snabbare bearbetning.",
      subTitle : "Ange värden för CSV-filen."
    },
    noPolygonLayers : "Inga polygonlager",
    errorOnOk : "Fyll i alla parametrar innan du sparar konfigurationen",
    saveFields : "Spara fält",
    cancelFields : "Avbryt fält",
    saveAdv : "Spara avancerade inställningar",
    cancelAdv : "Avbryt avancerade inställningar",
    advSettingsBtn : "Avancerade inställningar",
    chooseSymbol: "Välj en symbol",
    okBtn: "OK",
    cancelBtn: "Avbryt"
  })
);
