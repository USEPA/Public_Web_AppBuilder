define(
   ({
    settingsHeader : "Nastavte podrobnosti pro widget GeoLookup",
    settingsDesc : "Obohaťte seznam umístění ze souborů CSV pomocí polygonových vrstev v mapě. Vybraná pole polygonových vrstev se připojí k těmto umístěním.",
    settingsLoadingLayers: "Počkejte, dokud se nenahrají vrstvy.",
    settingsConfigureTitle: "Konfigurovat pole vrstvy",
    layerTable : {
      colEnrich : "Obohatit",
      colLabel : "Vrstva",
      colFieldSelector : "Pole"
    },
    fieldTable : {
      colAppend : "Připojit (Append)",
      colName : "Název",
      colAlias : "Alternativní jméno",
      colOrder : "Pořadí",
      label : "Zaškrtněte pole, která chcete připojit. Výběrem pole můžete změnit jeho alternativní jméno, řadit jej a formátovat."
    },
    symbolArea : {
      symbolLabelWithin : 'Vyberte symbol pro umístění uvnitř:',
      symbolLabelOutside : 'Vyberte symbol pro umístění mimo:'
    },
    advSettings : {
      label: "Pokročilá nastavení",
      latFieldsDesc : "Možné názvy polí pro pole zeměpisné šířky.",
      longFieldsDesc : "Možné názvy polí pro pole zeměpisné délky.",
      intersectFieldDesc : "Jméno vytvořeného pole, ve kterém budou uloženy hodnoty v případě, že vyhledávané umístění protnulo vrstvu.",
      intersectInDesc : "Hodnota, která bude uložena, pokud umístění protnulo polygon.",
      intersectOutDesc : "Hodnota, která bude uložena, pokud umístění neprotnulo polygon.",
      maxRowCount : "Maximální počet řádků v souboru CSV.",
      cacheNumberDesc : "Mezní hodnota shlukování bodů pro rychlejší zpracování.",
      subTitle : "Nastavte hodnoty pro soubor CSV."
    },
    noPolygonLayers : "Žádné polygonové vrstvy",
    errorOnOk : "Než konfiguraci uložíte, vyplňte všechny parametry.",
    saveFields : "Uložit pole",
    cancelFields : "Zrušit pole",
    saveAdv : "Uložit pokr. nastavení",
    cancelAdv : "Zrušit pokr. nastavení",
    advSettingsBtn : "Pokročilá nastavení",
    chooseSymbol: "Zvolte symbol",
    okBtn: "OK",
    cancelBtn: "Storno"
  })
);
