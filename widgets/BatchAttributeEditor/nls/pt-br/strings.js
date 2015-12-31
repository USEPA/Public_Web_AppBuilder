define(
   ({
    _widgetLabel: "Editor de Atributo em Lote",
    widgetIntroSelectByArea: "Utilize uma das ferramentas abaixo para criar um conjunto de feições selecionado para atualizar.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registros foi excedido.",
    widgetIntroSelectByFeature: "Utilize a ferramenta abaixo para selecionar uma feição da camada <font class=\'layerInIntro\'>${0}</font>.  Esta feição será utilizada para selecionar e atualizar todas as feições da intersecção.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registros foi excedido.",
    widgetIntroSelectByFeatureQuery: "Utilize a ferramenta abaixo para selecionar uma feição da camada <font class=\'layerInIntro\'>${0}</font> .  Este atributo <font class=\'layerInIntro\'>${1}</font> da feição será utilizado para consultar as camadas abaixo e atualizar as feições resultantes.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registros foi excedido.",
    widgetIntroSelectByQuery: "Insira um valor para criar um conjunto de seleção.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registros foi excedido.",
    layerTable: {
      colLabel: "Nome da Camada",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Nenhuma camada editável configurada",
    editorPopupTitle: "Editor de Atributo em Lote",
    editorPopupSaveBtn: "Salvar",
    editorPopupMultipleValues: "",
    clear: "Apagar",
    featuresUpdated: "${0} / ${1} feições atualizadas",
    featuresSelected: "${0} feições selecionadas",
    featuresSkipped: "Validado",
    search: "Pesquisar",
    queryInput: "Insira um valor para consultar",
    noFilterTip: "Sem expressão de filtro definida, esta tarefa de consulta listará todas as feições na fonte de dados especificada.",
    setFilterTip: "Configure o filtro corretamente.",
    filterPopup: "Filtrar Camada",
    cancel: "Cancelar",
    ok: "Ok",
    drawBox: {
      point: "Ponto",
      line: "Linha",
      polyline: "Polilinha",
      freehandPolyline: "Polilinha À Mão Livre",
      extent: "Extensão",
      polygon: "Polígono",
      freehandPolygon: "Polígono À Mão Livre",
      clear: "Apagar",
      addPointToolTip: "Clique para selecionar nesta área",
      addShapeToolTip: "Desenhe uma forma para selecionar feições",
      freehandToolTip: "Pressione e segure para desenhar uma forma para selecionar feições",
      startToolTip: "Desenhe uma forma para selecionar feições"
    },
    errors: {
      layerNotFound: "A camada ${0} com ID ${1} não foi localizada no mapa, o mapa pode ter mudado desde a configuração do widget",
      queryNullID: "A feição do ${0} retornou um ID inválido",
      noSelectedLayers: "Nenhuma camada selecionada com registros para atualizar",
      inputValueError: "Valor inválido no formulário"
    }
  })
);
