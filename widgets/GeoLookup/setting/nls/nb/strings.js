define(
   ({
    settingsHeader : "Angi detaljene for GeoLookup-widgeten",
    settingsDesc : "Suppler en liste med lokasjoner fra en CSV-fil mot polygonlagene i kartet. Valgte felt fra polygonlagene legges ved lokasjonene.",
    settingsLoadingLayers: "Vent mens lagene lastes inn.",
    settingsConfigureTitle: "Konfigurer felter for lagene",
    layerTable : {
      colEnrich : "Suppler",
      colLabel : "Lag",
      colFieldSelector : "Felter"
    },
    fieldTable : {
      colAppend : "Legg ved",
      colName : "Navn",
      colAlias : "Alias",
      colOrder : "Rekkefølge",
      label : "Merk av for feltene du vil legge ved. Velg et felt for å endre aliaset, endre rekkefølgen eller formatere det."
    },
    symbolArea : {
      symbolLabelWithin : 'Velg symbolet for lokasjoner innenfor:',
      symbolLabelOutside : 'Velg symbolet for lokasjoner utenfor:'
    },
    advSettings : {
      label: "Avanserte innstillinger",
      latFieldsDesc : "Mulige feltnavn for Breddegrad-felt.",
      longFieldsDesc : "Mulige feltnavn for Lengdegrad-felt.",
      intersectFieldDesc : "Navnet på feltet som er opprettet for å lagre verdien hvis søket krysser et lag.",
      intersectInDesc : "Verdi som skal lagres når lokasjon krysset et polygon.",
      intersectOutDesc : "Verdi som skal lagres når lokasjon ikke krysset et polygon.",
      maxRowCount : "Maksimum antall rader i CSV-fil.",
      cacheNumberDesc : "Punktklyngeterskel for raskere prosessering.",
      subTitle : "Angi verdier for CSV-fil."
    },
    noPolygonLayers : "Ingen polygonlag",
    errorOnOk : "Fyll inn alle parametere før du lagrer konfigurasjonen",
    saveFields : "Lagre felter",
    cancelFields : "Avbryt felter",
    saveAdv : "Lagre avanserte innstillinger",
    cancelAdv : "Avbryt avanserte innstillinger",
    advSettingsBtn : "Avanserte innstillinger",
    chooseSymbol: "Velg et symbol",
    okBtn: "OK",
    cancelBtn: "Avbryt"
  })
);
