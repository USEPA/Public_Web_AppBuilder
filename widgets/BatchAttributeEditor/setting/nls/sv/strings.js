define(
   ({
    page1: {
      selectToolHeader: "Välj en metod för att markera poster som ska uppdateras i grupp.",
      selectToolDesc: "Denna widget stöder tre metoder som kan användas för att generera ett urval poster som ska uppdateras. Du kan bara välja en av metoderna. Om du vill använda fler än en av metoderna, måste du skapa en ny instans av widgeten.",
      selectByShape: "Markera efter område",
      selectBySpatQuery: "Markera efter geoobjekt",
      selectByAttQuery: "Markera efter geoobjekt och relaterade geoobjekt",
      selectByQuery: "Markera efter fråga",
      toolNotSelected: "Markera en urvalsmetod"
    },
    page2: {
      layersToolHeader: "Markera de lager som ska uppdateras och välj eventuella urvalsverktyg.",
      layersToolDesc: "Urvalsmetoden du valde på sidan ett används för att markera och uppdatera den uppsättning lager som visas nedan. Om du markerar fler än ett lager kommer bara de gemensamt redigerbara fälten att vara tillgängliga för uppdatering. Beroende på vilket urvalsverktyg du väljer kan det krävas fler alternativ.",
      layerTable: {
        colUpdate: "Uppdatera",
        colLabel: "Lager",
        colSelectByLayer: "Välj enligt lager",
        colSelectByField: "Frågefält",
        colhighlightSymbol: "Markeringssymbol"
      },
      toggleLayers: "Slå på/av lagersynlighet vid öppning och stängning",
      noEditableLayers: "Inga redigerbara lager",
      noLayersSelected: "Markera ett eller flera lager innan du fortsätter"
    },
    page3: {
      commonFieldsHeader: "Markera fälten som ska uppdateras i grupp.",
      commonFieldsDesc: "Bara de gemensamt redigerbara fälten visas nedan. Markera de fält som du vill uppdatera. Om samma fält från olika lager har olika domän, visas och används bara en domän.",
      noCommonFields: "Inga gemensamma fält",
      fieldTable: {
        colEdit: "Redigerbar",
        colName: "Namn",
        colAlias: "Alias",
        colAction: "Åtgärd"
      }
    },
    tabs: {
      selection: "Definiera markeringstyp",
      layers: "Definiera lager som ska uppdateras",
      fields: "Definiera fält som ska uppdateras"
    },
    errorOnOk: "Fyll i alla parametrar innan du sparar konfigurationen",
    next: "Nästa",
    back: "Bakom",
    save: "Spara symbol",
    cancel: "Avbryt",
    ok: "OK",
    symbolPopup: "Symbolväljaren"
  })
);
