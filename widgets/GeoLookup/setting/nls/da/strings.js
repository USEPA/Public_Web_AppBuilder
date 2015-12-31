define(
   ({
    settingsHeader : "Angiv oplysninger for GeoLookup Widget",
    settingsDesc : "Geo-berig en liste med positioner fra en CSV-fil op imod polygonlag på kortet. Udvalgte felter fra polygonlagene knyttes til positionerne.",
    settingsLoadingLayers: "Vent, mens lagene indlæses.",
    settingsConfigureTitle: "Konfigurér lagfelter",
    layerTable : {
      colEnrich : "Enrich",
      colLabel : "Lag",
      colFieldSelector : "Felter"
    },
    fieldTable : {
      colAppend : "Tilknyt",
      colName : "Navn",
      colAlias : "Alias",
      colOrder : "Rækkefølge",
      label : "Markér det felt, der skal tilknyttes. Markér et felt for at ændre dets alias, sortere eller formatere det."
    },
    symbolArea : {
      symbolLabelWithin : 'Vælg symbol for positioner inden for:',
      symbolLabelOutside : 'Vælg symbol for positioner uden for:'
    },
    advSettings : {
      label: "Avancerede indstillinger",
      latFieldsDesc : "Mulige feltnavne for breddegradsfelt.",
      longFieldsDesc : "Mulige feltnavne for længdegradsfelt.",
      intersectFieldDesc : "Navn på det felt, der blev oprettet til at gemme værdier, hvis søgningen gennemskærer et lag.",
      intersectInDesc : "Den værdi, der skal gemmes, når positionen gennemskærer en polygon.",
      intersectOutDesc : "Den værdi, der skal gemmes, når positionen ikke gennemskærer en polygon.",
      maxRowCount : "Det maksimale antal rækker i CSV-filen.",
      cacheNumberDesc : "Punktklyngetærskel for hurtigere behandling.",
      subTitle : "Angiv værdier for CSV-filen."
    },
    noPolygonLayers : "Ingen polygonlag",
    errorOnOk : "Udfyld alle parametre, før konfigurationen gemmes",
    saveFields : "Gem felter",
    cancelFields : "Annullér felter",
    saveAdv : "Gem avanc. indstillinger",
    cancelAdv : "Annullér avanc. indstillinger",
    advSettingsBtn : "Avancerede indstillinger",
    chooseSymbol: "Vælg et symbol",
    okBtn: "OK",
    cancelBtn: "Annullér"
  })
);
