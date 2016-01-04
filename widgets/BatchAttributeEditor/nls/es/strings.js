define(
   ({
    _widgetLabel: "Editor de atributos por lotes",
    widgetIntroSelectByArea: "Usa una de las siguientes herramientas para crear un conjunto seleccionado de entidades para actualizar.  Si la fila está <font class=\'maxRecordInIntro\'>resaltada</font>, se ha sobrepasado el número máximo de registros.",
    widgetIntroSelectByFeature: "Usa la siguiente herramienta para seleccionar una entidad de la capa <font class=\'layerInIntro\'>${0}</font>.  Esta entidad se utilizará para seleccionar y actualizar todas las entidades que se intersecan.  Si la fila está <font class=\'maxRecordInIntro\'>resaltada</font>, se ha sobrepasado el número máximo de registros.",
    widgetIntroSelectByFeatureQuery: "Usa la siguiente herramienta para seleccionar una entidad de <font class=\'layerInIntro\'>${0}</font>.  El atributo <font class=\'layerInIntro\'>${1}</font> de esta entidad se utilizará para consultar las siguientes capas y actualizar las entidades resultantes.  Si la fila está <font class=\'maxRecordInIntro\'>resaltada</font>, se ha sobrepasado el número máximo de registros.",
    widgetIntroSelectByQuery: "Introduce un valor para crear un conjunto de selección.  Si la fila está <font class=\'maxRecordInIntro\'>resaltada</font>, se ha sobrepasado el número máximo de registros.",
    layerTable: {
      colLabel: "Nombre de la capa",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "No se ha configurado ninguna capa editable",
    editorPopupTitle: "Editor de atributos por lotes",
    editorPopupSaveBtn: "Guardar",
    editorPopupMultipleValues: "",
    clear: "Borrar",
    featuresUpdated: "${0}/${1} entidad(es) actualizada(s)",
    featuresSelected: "${0} entidad(es) seleccionada(s)",
    featuresSkipped: "Omitido",
    search: "Búsqueda",
    queryInput: "Introduce el valor que deseas consultar",
    noFilterTip: "Sin expresión de filtro definida, esta tarea de consulta enumerará todas las entidades de la fuente de datos especificada.",
    setFilterTip: "Define el filtro correctamente.",
    filterPopup: "Capa de filtro",
    cancel: "Cancelar",
    ok: "Aceptar",
    drawBox: {
      point: "Punto",
      line: "Línea",
      polyline: "Polilínea",
      freehandPolyline: "Polilínea a mano alzada",
      extent: "Extensión",
      polygon: "de polígono",
      freehandPolygon: "Polígono a mano alzada",
      clear: "Borrar",
      addPointToolTip: "Haz clic para seleccionar en esta área",
      addShapeToolTip: "Dibuja una forma para seleccionar entidades",
      freehandToolTip: "Pulsa y mantén pulsado para dibujar una forma y seleccionar entidades",
      startToolTip: "Dibuja una forma para seleccionar entidades"
    },
    errors: {
      layerNotFound: "La capa ${0} con el Id. ${1} no se ha encontrado en el mapa. Es posible que el mapa haya cambiado desde la configuración de los widgets.",
      queryNullID: "La entidad de ${0} ha devuelto un Id. no válido",
      noSelectedLayers: "No se ha seleccionado ninguna capa con registros para actualizar",
      inputValueError: "Valor no válido en el formulario"
    }
  })
);
