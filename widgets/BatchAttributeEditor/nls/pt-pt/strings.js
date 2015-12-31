define(
   ({
    _widgetLabel: "Editor de Atributos em Batch",
    widgetIntroSelectByArea: "Utilize uma das ferramentas abaixo para criar o conjunto selecionado de elementos a atualizar.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registos foi excedido.",
    widgetIntroSelectByFeature: "Utilize a ferramenta abaixo para selecionar um elemento da camada <font class=\'layerInIntro\'>${0}</font> .  Este elemento será utilizado selecionar e atualizar todos os elementos em interseção.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registos foi excedido.",
    widgetIntroSelectByFeatureQuery: "Utilize a ferramenta abaixo para selecionar um elemento de <font class=\'layerInIntro\'>${0}</font> .  O atributo <font class=\'layerInIntro\'>${1}</font> desta camada será utilizado para consultar as camadas abaixo e atualizar os elementos resultantes.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registos foi excedido.",
    widgetIntroSelectByQuery: "Introduza um valor para criar um conjunto de seleção.  Se a linha estiver <font class=\'maxRecordInIntro\'>destacada</font>, o número máximo de registos foi excedido.",
    layerTable: {
      colLabel: "Nome da Camada",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Não foram configuradas quaisquer camadas editáveis",
    editorPopupTitle: "Editor de Atributos em Batch",
    editorPopupSaveBtn: "Guardar",
    editorPopupMultipleValues: "",
    clear: "Limpar",
    featuresUpdated: "${0} / ${1} elemento(s) atualizado(s)",
    featuresSelected: "${0} elemento(s) selecionado(s)",
    featuresSkipped: "Ignorados",
    search: "Pesquisar",
    queryInput: "Introduza um valor para consulta",
    noFilterTip: "Sem uma expressão de filtro definida, esta tarefa de consulta irá listar todos os elementos na fonte de dados especificada.",
    setFilterTip: "Por favor, defina o filtro corretamente.",
    filterPopup: "Filtrar Camada",
    cancel: "Cancelar",
    ok: "OK",
    drawBox: {
      point: "Ponto",
      line: "Linha",
      polyline: "Polilinha",
      freehandPolyline: "Polilinha À Mão Livre",
      extent: "Estender",
      polygon: "Polígono",
      freehandPolygon: "Polígono À Mão Livre",
      clear: "Limpar",
      addPointToolTip: "Clique para selecionar nesta área",
      addShapeToolTip: "Desenhe uma forma para selecionar elementos",
      freehandToolTip: "Mantenha pessionado para desenhar uma forma para selecionar elementos",
      startToolTip: "Desenhe uma forma para selecionar elementos"
    },
    errors: {
      layerNotFound: "A camada ${0} com a ID ${1} não foi encontrada no mapa, o mapa pode ter sido alterado desde a configuração dos widgets",
      queryNullID: "O elemento de ${0} foi devolvido com uma ID inválida",
      noSelectedLayers: "Não existem camadas selecionadas com registos para atualizar",
      inputValueError: "Valor inválido no formulário"
    }
  })
);
