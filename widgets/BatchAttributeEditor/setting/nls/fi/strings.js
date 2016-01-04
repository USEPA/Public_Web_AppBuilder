define(
   ({
    page1: {
      selectToolHeader: "Valitse menetelmä, jolla joukkopäivitettävät tietueet valitaan.",
      selectToolDesc: "Tämä pienoisohjelma tukee kolmea eri menetelmää, joilla päivitettävien tietueiden joukko voidaan luoda. Voit valita vain yhden menetelmistä. Jos tarvitset useamman kuin yhden näistä kolmesta menetelmästä, luo pienoisohjelmasta uusi ilmentymä.",
      selectByShape: "Valitse alueen mukaan",
      selectBySpatQuery: "Valitse kohteen mukaan",
      selectByAttQuery: "Valitse kohteen ja liittyvien kohteiden mukaan",
      selectByQuery: "Valitse kyselyn mukaan",
      toolNotSelected: "Valitse valintamenetelmä"
    },
    page2: {
      layersToolHeader: "Valitse päivitettävät karttatasot ja mahdolliset valintatyökalut.",
      layersToolDesc: "Ensimmäisellä sivulla valitsemaasi valintamenetelmää käytetään alla lueteltujen karttatasojen valitsemiseen ja päivittämiseen. Jos valitset useita karttatasoja, vain yleiset muokattavat kentät voidaan päivittää. Valitsemasi valintatyökalun mukaan joudut ehkä valitsemaan lisäasetuksia.",
      layerTable: {
        colUpdate: "Päivitä",
        colLabel: "Karttataso",
        colSelectByLayer: "Valitse karttatason mukaan",
        colSelectByField: "Kyselykenttä",
        colhighlightSymbol: "Korostussymboli"
      },
      toggleLayers: "Vaihda karttatasojen näkyvyyttä avattaessa ja suljettaessa",
      noEditableLayers: "Ei muokattavia karttatasoja",
      noLayersSelected: "Valitse yksi karttataso ennen jatkamista"
    },
    page3: {
      commonFieldsHeader: "Valitse joukkopäivitettävät kentät.",
      commonFieldsDesc: "Alla näkyvät vain yleiset muokattavat kentät. Valitse päivitettävät kentät. Jos eri karttatasojen samalla kentällä on eri domain, näytetään ja käytetään vain yhtä domainia.",
      noCommonFields: "Ei yleisiä kenttiä",
      fieldTable: {
        colEdit: "Muokattavissa",
        colName: "Nimi",
        colAlias: "Alias",
        colAction: "Toimi"
      }
    },
    tabs: {
      selection: "Määritä valintatyyppi",
      layers: "Määritä päivitettävät karttatasot",
      fields: "Määritä päivitettävät kentät"
    },
    errorOnOk: "Anna kaikki parametrit ennen kokoonpanon tallentamista",
    next: "Seuraava",
    back: "Takaisin",
    save: "Tallenna symboli",
    cancel: "Peruuta",
    ok: "OK",
    symbolPopup: "Symbolin valitsin"
  })
);
