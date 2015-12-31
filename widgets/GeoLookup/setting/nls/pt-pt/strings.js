define(
   ({
    settingsHeader : "Defina os detalhes para o Widget GeoLookup",
    settingsDesc : "Geo-enriqueça uma lista de localizações de um ficheiro CSV em relação a camadas de polígono no mapa. Os campos selecionados de camadas de polígonos são anexados às localizações.",
    settingsLoadingLayers: "Por favor, aguarde enquanto as camadas estão a carregar.",
    settingsConfigureTitle: "Configurar Campos de Camadas",
    layerTable : {
      colEnrich : "Melhorar",
      colLabel : "Camada",
      colFieldSelector : "Campos"
    },
    fieldTable : {
      colAppend : "Anexar",
      colName : "Nome",
      colAlias : "Nome Alternativo",
      colOrder : "Ordem",
      label : "Defina o campo que pretende exibir. Selecione um campo para alterar o respetivo nome alternativo, ordenar e formatar."
    },
    symbolArea : {
      symbolLabelWithin : 'Selecione o símbolo para localizações contidas:',
      symbolLabelOutside : 'Selecione o símbolo para localizações não-contidas:'
    },
    advSettings : {
      label: "Definições Avançadas",
      latFieldsDesc : "Nomes da campo possíveis para o campo Latitude.",
      longFieldsDesc : "Nomes da campo possíveis para o campo Longitude.",
      intersectFieldDesc : "O nome do campo criado para alojar valor se a pesquisa interseta uma camada.",
      intersectInDesc : "Valor a alojar quando a localização interseta um polígono.",
      intersectOutDesc : "Valor a alojar quando a localização não interseta um polígono.",
      maxRowCount : "Número máximo de linhas em ficheiro CSV.",
      cacheNumberDesc : "Limiar de cluster de pontos para processamento mais rápido.",
      subTitle : "Defina valores para ficheiro CSV."
    },
    noPolygonLayers : "Sem Camadas de Polígono",
    errorOnOk : "Por favor, preencha todos os parâmetros antes de guardar a configuração",
    saveFields : "Guardar Campos",
    cancelFields : "Cancelar Campos",
    saveAdv : "Guardar Adv. Definições",
    cancelAdv : "Cancelar Adv. Definições",
    advSettingsBtn : "Definições Avançadas",
    chooseSymbol: "Escolha um Símbolo",
    okBtn: "OK",
    cancelBtn: "Cancelar"
  })
);
