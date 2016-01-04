define(
   ({
    page1: {
      selectToolHeader: "Vælg en metode til valg af poster, der skal batch-opdateres.",
      selectToolDesc: "Denne widget understøtter 3 forskellige metoder til generering af et udvalgt sæt poster, der skal opdateres. Du kan kun vælge én af metoderne. Hvis du skal bruge mere end én af disse metoder, skal du oprette en ny forekomst af widget\'en.",
      selectByShape: "Vælg efter område",
      selectBySpatQuery: "Valgt efter objekt",
      selectByAttQuery: "Vælg efter objekt og relaterede objekter",
      selectByQuery: "Vælg efter forespørgsel",
      toolNotSelected: "Vælg en udvælgelsesmetode"
    },
    page2: {
      layersToolHeader: "Vælg de lag, der skal opdateres, samt eventuelle indstillinger for markeringsværktøjer.",
      layersToolDesc: "Den udvælgelsesmetode, du valgte på side ét, vil blive anvendt til at vælge og opdatere et sæt lag, der er angivet nedenfor. Hvis du markerer mere end ét lag, kan kun almindelige redigérbare felter opdateres. Afhængigt af dit valg af udvælgelsesværktøj kan yderligere indstillinger være påkrævet.",
      layerTable: {
        colUpdate: "Opdatér",
        colLabel: "Lag",
        colSelectByLayer: "Vælg efter lag",
        colSelectByField: "Forespørgselsfelt",
        colhighlightSymbol: "Fremhæv symbol"
      },
      toggleLayers: "Skift lagenes synlighed ved åbning og lukning",
      noEditableLayers: "Ingen redigérbare lag",
      noLayersSelected: "Vælg et eller flere lag, før du fortsætter"
    },
    page3: {
      commonFieldsHeader: "Vælg de felter, der skal batch-opdateres.",
      commonFieldsDesc: "Kun almindelige redigérbare felter vil blive vist nedenfor. Markér de felter, du vil opdatere. Hvis det samme felt fra forskellige lag har flere domæner, vises der kun ét domæne, som også vil blive brugt.",
      noCommonFields: "Ingen almindelige felter",
      fieldTable: {
        colEdit: "Redigérbar",
        colName: "Navn",
        colAlias: "Alias",
        colAction: "Handling"
      }
    },
    tabs: {
      selection: "Definér udvælgelsestype",
      layers: "Definér lag, der skal opdateres",
      fields: "Definér felter, der skal opdateres"
    },
    errorOnOk: "Udfyld alle parametre, før konfigurationen gemmes",
    next: "Næste",
    back: "Tilbage",
    save: "Gem symbol",
    cancel: "Annullér",
    ok: "OK",
    symbolPopup: "Symbolvælger"
  })
);
