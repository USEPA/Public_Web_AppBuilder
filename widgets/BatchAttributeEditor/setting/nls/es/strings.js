define(
   ({
    page1: {
      selectToolHeader: "Elige un método para seleccionar los registros para una actualización por lotes.",
      selectToolDesc: "El widget admite 3 métodos para generar un conjunto seleccionado de registros con el fin de actualizarlos. Puedes elegir uno de estos métodos. Si necesitas más de uno de estos métodos, crea otra instancia del widget.",
      selectByShape: "Seleccionar por área",
      selectBySpatQuery: "Seleccionar por entidad",
      selectByAttQuery: "Seleccionar por entidad y por entidades relacionadas",
      selectByQuery: "Seleccionar por consulta",
      toolNotSelected: "Elige un método de selección"
    },
    page2: {
      layersToolHeader: "Selecciona las capas que se deben actualizar y las opciones de las herramientas de selección, si las hay.",
      layersToolDesc: "El método de selección que has elegido en la página uno se utilizará para seleccionar y actualizar el conjunto de capas que se muestra a continuación.  Si activas más de una capa, solo los campos editables comunes estarán disponibles para la actualización.  Dependiendo de la herramienta de selección elegida, pueden ser necesarias otras opciones adicionales.",
      layerTable: {
        colUpdate: "Actualización",
        colLabel: "Capa",
        colSelectByLayer: "Seleccionar por capa",
        colSelectByField: "Campo de consulta",
        colhighlightSymbol: "Resaltar símbolo"
      },
      toggleLayers: "Modificar la visibilidad de las capas al abrir y cerrar",
      noEditableLayers: "No hay capas editables",
      noLayersSelected: "Selecciona una o varias capas antes de continuar"
    },
    page3: {
      commonFieldsHeader: "Selecciona los campos que desees actualizar por lotes.",
      commonFieldsDesc: "Solo los campos editables comunes se mostrarán a continuación.  Selecciona los campos que deseas actualizar.  Si el mismo campo de distintas capas tiene un dominio diferente, solo se mostrará y se utilizará un dominio.",
      noCommonFields: "No hay campos comunes",
      fieldTable: {
        colEdit: "Editable",
        colName: "Nombre",
        colAlias: "Alias",
        colAction: "Acción"
      }
    },
    tabs: {
      selection: "Definir tipo de selección",
      layers: "Definir capas para actualizar",
      fields: "Definir campos para actualizar"
    },
    errorOnOk: "Rellena todos los parámetros antes de guardar la configuración",
    next: "Siguiente",
    back: "Atrás",
    save: "Guardar símbolo",
    cancel: "Cancelar",
    ok: "Aceptar",
    symbolPopup: "Selector de símbolos"
  })
);
