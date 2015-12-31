define(
   ({
    _widgetLabel: "Dávkový editor atributů",
    widgetIntroSelectByArea: "Pomocí jednoho z níže uvedených nástrojů vytvořte vybranou sadu prvků, které chcete aktualizovat.  Pokud je řádek <font class=\'maxRecordInIntro\'>zvýrazněný</font>, byl překročen maximální počet záznamů.",
    widgetIntroSelectByFeature: "Pomocí níže uvedeného nástroje vyberte prvek z vrstvy <font class=\'layerInIntro\'>${0}</font>.  Tento prvek se použije k výběru a aktualizování všech protínajících prvků.  Pokud je řádek <font class=\'maxRecordInIntro\'>zvýrazněný</font>, byl překročen maximální počet záznamů.",
    widgetIntroSelectByFeatureQuery: "Pomocí níže uvedeného nástroje vyberte prvek z vrstvy <font class=\'layerInIntro\'>${0}</font>.  Atribut <font class=\'layerInIntro\'>${1}</font> tohoto prvku se použije k dotázání níže uvedených vrstev a aktualizaci výsledných prvků.  Pokud je řádek <font class=\'maxRecordInIntro\'>zvýrazněný</font>, byl překročen maximální počet záznamů.",
    widgetIntroSelectByQuery: "Zadejte hodnotu, podle které chcete vytvořit sadu výběru.  Pokud je řádek <font class=\'maxRecordInIntro\'>zvýrazněný</font>, byl překročen maximální počet záznamů.",
    layerTable: {
      colLabel: "Jméno vrstvy",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Nejsou nakonfigurovány žádné editovatelné vrstvy",
    editorPopupTitle: "Dávkový editor atributů",
    editorPopupSaveBtn: "Uložit",
    editorPopupMultipleValues: "",
    clear: "Vyprázdnit",
    featuresUpdated: "Aktualizované prvky: ${0} / ${1}",
    featuresSelected: "Počet vybraných prvků: ${0}",
    featuresSkipped: "Vynecháno",
    search: "Hledat",
    queryInput: "Zadejte hodnotu pro dotázání",
    noFilterTip: "Pokud nedefinujete výraz filtru, tato dotazovací úloha zobrazí všechny prvky v zadaném zdroji dat.",
    setFilterTip: "Nastavte filtr správně.",
    filterPopup: "Filtr vrstvy",
    cancel: "Storno",
    ok: "OK",
    drawBox: {
      point: "Bod",
      line: "Linie",
      polyline: "Polylinie",
      freehandPolyline: "Polylinie od ruky",
      extent: "Rozsah",
      polygon: "Polygon",
      freehandPolygon: "Polygon od ruky",
      clear: "Vyprázdnit",
      addPointToolTip: "Kliknutím provedete výběr v této oblasti",
      addShapeToolTip: "Nakreslete tvar, který chcete použít k výběru prvků",
      freehandToolTip: "Stisknutím a přidržením nakreslíte tvar, který se použije k výběru prvků",
      startToolTip: "Nakreslete tvar, který chcete použít k výběru prvků"
    },
    errors: {
      layerNotFound: "Vrstva ${0} s ID ${1} nebyla v mapě nalezena. Mapa se možná od prvotní konfigurace změnila.",
      queryNullID: "Prvek z ${0} vrátil neplatné ID",
      noSelectedLayers: "Nebyly zvoleny žádné vrstvy se záznamy k aktualizování",
      inputValueError: "Formulář obsahuje neplatnou hodnotu"
    }
  })
);
