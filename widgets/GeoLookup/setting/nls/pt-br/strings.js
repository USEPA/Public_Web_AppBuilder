define(
   ({
    settingsHeader : "Configurar os detalhes do Widget de Pesquisa Geográfica",
    settingsDesc : "Geo-enriqueça uma lista de locais a partir de um arquivo CSV em relação às camadas de polígono no mapa. Os campos selecionados a partir das camadas de polígono são adicionados nos locais.",
    settingsLoadingLayers: "Aguarde enquanto as camadas são carregadas.",
    settingsConfigureTitle: "Configurar Campos da Camada",
    layerTable : {
      colEnrich : "Enriquecer",
      colLabel : "Camada",
      colFieldSelector : "Campos"
    },
    fieldTable : {
      colAppend : "Anexar",
      colName : "Nome",
      colAlias : "Nome Alternativo",
      colOrder : "Ordem",
      label : "Verifique o campo que você deseja anexar. Selecione um campo para alterar seu nome alternativo, ordenar e formatá-lo."
    },
    symbolArea : {
      symbolLabelWithin : 'Selecione o símbolo para localizações dentro:',
      symbolLabelOutside : 'Selecione o símbolo para localizações fora:'
    },
    advSettings : {
      label: "Configurações Avançadas",
      latFieldsDesc : "Possíveis nomes de campo para o campo de Latitude.",
      longFieldsDesc : "Possíveis nomes de campo para o campo de Longitude.",
      intersectFieldDesc : "O nome de campo criado para armazenar valor se a pesquisa interseccionou uma camada.",
      intersectInDesc : "Valor para armazenar quando a localização interseccionou um polígono.",
      intersectOutDesc : "Valor para armazenar quando a localização não interseccionou um polígono.",
      maxRowCount : "Número máximo de linhas no arquivo CSV.",
      cacheNumberDesc : "Limite do agrupamento de ponto para processamento mais rápido.",
      subTitle : "Configure valores para o arquivo CSV."
    },
    noPolygonLayers : "Nenhuma Camada de Polígono",
    errorOnOk : "Preencha todos os parâmetros antes de salvar a configuração",
    saveFields : "Salvar Campos",
    cancelFields : "Cancelar Campos",
    saveAdv : "Salvar Configurações Avançadas",
    cancelAdv : "Cancelar Configurações Avançadas",
    advSettingsBtn : "Configurações Avançadas",
    chooseSymbol: "Escolher um Símbolo",
    okBtn: "Ok",
    cancelBtn: "Cancelar"
  })
);
