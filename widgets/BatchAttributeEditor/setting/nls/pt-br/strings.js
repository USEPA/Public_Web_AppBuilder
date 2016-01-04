define(
   ({
    page1: {
      selectToolHeader: "Escolha um método para selecionar registros para atualização em lote.",
      selectToolDesc: "O widget suporta 3 métodos para gerar um conjunto de registros selecionado para atualizar. Você pode escolher somente um dos métodos. Se você exigir mais de um destes métodos, crie uma nova instância do widget.",
      selectByShape: "Selecionar por Área",
      selectBySpatQuery: "Selecionar por Feição",
      selectByAttQuery: "Selecionar por Feição & Feições Relacionadas",
      selectByQuery: "Selecionar por Consulta",
      toolNotSelected: "Selecione um método de seleção"
    },
    page2: {
      layersToolHeader: "Selecione as camadas para atualizar e as opções das ferramentas de seleção, se tiver.",
      layersToolDesc: "O método de seleção que você escolheu na página será utilizado para selecionar e atualizar um conjunto de camadas listadas abaixo.  Se você marcar mais de uma camada, somente os campos editáveis comuns estarão disponíveis para atualizar.  Dependendo da sua escolha na ferramenta de seleção, opções adicionais serão exigidas.",
      layerTable: {
        colUpdate: "Atualizar",
        colLabel: "Camada",
        colSelectByLayer: "Selecionar por Camada",
        colSelectByField: "Campo de Consulta",
        colhighlightSymbol: "Símbolo de Destaque"
      },
      toggleLayers: "Alternar visibilidade das camadas ao abrir e fechar",
      noEditableLayers: "Nenhuma Camada Editável",
      noLayersSelected: "Selecione uma de muitas camadas antes de continuar"
    },
    page3: {
      commonFieldsHeader: "Selecione os campos para atualização em lote.",
      commonFieldsDesc: "Somente os campos editáveis comuns serão mostrados abaixo.  Selecione os campos que você deseja atualizar.  Se o mesmo campo de diferentes camadas tiver um domínio diferente, somente um domínio será mostrado e utilizado.",
      noCommonFields: "Nenhum Campo em Comum",
      fieldTable: {
        colEdit: "Editável",
        colName: "Nome",
        colAlias: "Nome Alternativo",
        colAction: "Ação"
      }
    },
    tabs: {
      selection: "Definir Tipo de Seleção",
      layers: "Definir Camada para Atualizar",
      fields: "Definir Campos para Atualizar"
    },
    errorOnOk: "Preencha todos os parâmetros antes de salvar a configuração",
    next: "Avançcar",
    back: "Voltar",
    save: "Salvar Símbolo",
    cancel: "Cancelar",
    ok: "Ok",
    symbolPopup: "Seletor de Símbolo"
  })
);
