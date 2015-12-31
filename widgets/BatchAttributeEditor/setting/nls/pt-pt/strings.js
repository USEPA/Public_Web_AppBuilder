define(
   ({
    page1: {
      selectToolHeader: "Escolha um método para selecionar registos para atualização em batch.",
      selectToolDesc: "O widget suporta 3 métodos para gerar um conjunto selecionado de registos para atualizar. Pode escolher apenas um dos métodos. Se necessitar de mais do que um destes métodos, crie uma nova instância do widget.",
      selectByShape: "Selecionar por Área",
      selectBySpatQuery: "Selecionar por Elemento",
      selectByAttQuery: "Selecionar por Elemento &amp; Elementos Relacionados",
      selectByQuery: "Selecionar por Consulta",
      toolNotSelected: "Por favor escolha um método de seleção"
    },
    page2: {
      layersToolHeader: "Selecione as camadas a atualizar e as opções de ferramentas de seleção, se alguma.",
      layersToolDesc: "O método de seleção que escolheu na página um será utilizado para escolher e atualizar um conjunto de camadas listadas abaixo.  Se selecionar mais do que uma camada, apenas os campos comuns editáveis estarão disponíveis para atualizar.  Dependendo da sua escolha de ferramenta de seleção, serão necessárias opções adicionais.",
      layerTable: {
        colUpdate: "Atualização",
        colLabel: "Camada",
        colSelectByLayer: "Selecionar por Camada",
        colSelectByField: "Consultar Campo",
        colhighlightSymbol: "Destacar Símbolo"
      },
      toggleLayers: "Alterne a visibilidade das camadas ao abrir e fechar",
      noEditableLayers: "Sem Camadas Editáveis",
      noLayersSelected: "Selecione uma ou mais camadas antes de avançar"
    },
    page3: {
      commonFieldsHeader: "Selecione os campos para atualização em batch.",
      commonFieldsDesc: "Apenas os campos editáveis comuns serão exibidos abaixo.  Por favor, selecione os campos que pretende atualizar.  Se o mesmo campo de diferentes camadas tiver um domínio diferente, apenas um domínio será exibido e utilizado.",
      noCommonFields: "Sem Campos Comuns",
      fieldTable: {
        colEdit: "Editável",
        colName: "Nome",
        colAlias: "Nome Alternativo",
        colAction: "Ação"
      }
    },
    tabs: {
      selection: "Sefinir Tipo de Seleção",
      layers: "Definir Camada(s) a Atualizar",
      fields: "Definir Campo(s) a Atualizar"
    },
    errorOnOk: "Por favor, preencha todos os parâmetros antes de guardar a configuração",
    next: "Seguinte",
    back: "Retroceder",
    save: "Guardar Símbolo",
    cancel: "Cancelar",
    ok: "OK",
    symbolPopup: "Seletor de Símbolos"
  })
);
