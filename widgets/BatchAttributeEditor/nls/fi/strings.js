define(
   ({
    _widgetLabel: "Erämääritteen muokkain",
    widgetIntroSelectByArea: "Luo päivitettävien kohteiden joukko käyttämällä yhtä alla olevista työkaluista. Jos rivi näkyy <font class=\'maxRecordInIntro\'>korostettuna</font>, tietueiden enimmäismäärä on ylittynyt.",
    widgetIntroSelectByFeature: "Valitse kohde karttatasosta <font class=\'layerInIntro\'>${0}</font> alla olevalla työkalulla. Tätä kohdetta käytetään kaikkien leikkaavien kohteiden valitsemiseen ja päivittämiseen. Jos rivi näkyy <font class=\'maxRecordInIntro\'>korostettuna</font>, tietueiden enimmäismäärä on ylittynyt.",
    widgetIntroSelectByFeatureQuery: "Valitse kohde kohteesta <font class=\'layerInIntro\'>${0}</font> alla olevalla työkalulla. Tämän kohteen määritettä <font class=\'layerInIntro\'>${1}</font> käytetään kyselyjen suorittamiseen alla olevista karttatasoista ja tuloksena olevien kohteiden päivittämiseen. Jos rivi näkyy <font class=\'maxRecordInIntro\'>korostettuna</font>, tietueiden enimmäismäärä on ylittynyt.",
    widgetIntroSelectByQuery: "Luo valintajoukko antamalla arvo. Jos rivi näkyy <font class=\'maxRecordInIntro\'>korostettuna</font>, tietueiden enimmäismäärä on ylittynyt.",
    layerTable: {
      colLabel: "Karttatason nimi",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Muokattavia karttatasoja ei ole määritetty",
    editorPopupTitle: "Erämääritteen muokkain",
    editorPopupSaveBtn: "Tallenna",
    editorPopupMultipleValues: "",
    clear: "Tyhjennä",
    featuresUpdated: "${0}/${1} kohdetta on päivitetty",
    featuresSelected: "Kohteita on valittu ${0}",
    featuresSkipped: "Ohitettu",
    search: "Etsi",
    queryInput: "Suorita kysely antamalla arvo",
    noFilterTip: "Jos suodatinlauseketta ei määritetä, kyselytehtävä luetteloi kaikki määritetyn tietolähteen kohteet.",
    setFilterTip: "Määritä suodatin oikein.",
    filterPopup: "Suodata taso",
    cancel: "Peruuta",
    ok: "OK",
    drawBox: {
      point: "Piste",
      line: "Viiva",
      polyline: "Taiteviiva",
      freehandPolyline: "Vapaakädenpiirto, viiva",
      extent: "Laajuus",
      polygon: "Alue",
      freehandPolygon: "Vapaankäden alue",
      clear: "Tyhjennä",
      addPointToolTip: "Valitse tältä alueelta napsauttamalla",
      addShapeToolTip: "Valitse kohteita piirtämällä muoto",
      freehandToolTip: "Valitse kohteita piirtämällä muoto pitkällä painalluksella",
      startToolTip: "Valitse kohteita piirtämällä muoto"
    },
    errors: {
      layerNotFound: "Karttatasoa ${0}, jonka tunnus on ${1}, ei löydy kartasta. Kartta on saattanut muuttua pienoisohjelman edellisen määrityksen jälkeen",
      queryNullID: "Kohde kohteesta ${0} palautti virheellisen tunnuksen",
      noSelectedLayers: "Päivitettäviä karttatasoja ja tietueita ei ole valittu",
      inputValueError: "Virheellinen arvo lomakkeessa"
    }
  })
);
