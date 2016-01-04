define(
   ({
    settingsHeader : "Määritä geohaun pienoisohjelman tiedot",
    settingsDesc : "Lisää geotietoja sijaintiluetteloon CSV-tiedostosta kartan aluekarttatasojen avulla. Aluekarttatasojen valitut kentät liitetään sijainteihin.",
    settingsLoadingLayers: "Odota, kunnes karttatasot on ladattu.",
    settingsConfigureTitle: "Määritä karttatason kentät",
    layerTable : {
      colEnrich : "Rikasta",
      colLabel : "Karttataso",
      colFieldSelector : "Kentät"
    },
    fieldTable : {
      colAppend : "Liitä jatkoksi",
      colName : "Nimi",
      colAlias : "Alias",
      colOrder : "Järjestä",
      label : "Valitse liitettävä kenttä. Valitse kenttä, kun haluat muuttaa sen aliaksen, järjestää sen ja muotoilla sitä."
    },
    symbolArea : {
      symbolLabelWithin : 'Valitse symboli seuraavien sisässä oleville sijainneille:',
      symbolLabelOutside : 'Valitse symboli seuraavien ulkopuolella oleville sijainneille:'
    },
    advSettings : {
      label: "Lisäasetukset",
      latFieldsDesc : "Leveysastekentän mahdolliset kentän nimet.",
      longFieldsDesc : "Pituusastekentän mahdolliset kentän nimet.",
      intersectFieldDesc : "Arvon tallennusta varten luodun kentän nimi, jos haku leikkasi karttatason.",
      intersectInDesc : "Tallennettava arvo, kun sijainti leikkasi polygonin.",
      intersectOutDesc : "Tallennettava arvo, kun sijainti ei leikannut polygonia.",
      maxRowCount : "CSV-tiedoston rivien enimmäismäärä.",
      cacheNumberDesc : "Nopeuta käsittelyä asettamalla klusterin raja-arvo.",
      subTitle : "Määritä CSV-tiedoston arvot."
    },
    noPolygonLayers : "Ei aluekarttatasoja",
    errorOnOk : "Anna kaikki parametrit ennen kokoonpanon tallentamista",
    saveFields : "Tallenna kentät",
    cancelFields : "Peruuta kentät",
    saveAdv : "Tallenna lisäasetukset",
    cancelAdv : "Peruuta lisäasetukset",
    advSettingsBtn : "Lisäasetukset",
    chooseSymbol: "Valitse symboli",
    okBtn: "OK",
    cancelBtn: "Peruuta"
  })
);
