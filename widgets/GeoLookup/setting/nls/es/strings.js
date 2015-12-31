define(
   ({
    settingsHeader : "Definir los detalles del widget Geobúsqueda",
    settingsDesc : "Geoenriquece una lista de ubicaciones de un archivo CSV con capas de polígonos del mapa. Los campos seleccionados en las capas de polígonos se anexan a las ubicaciones.",
    settingsLoadingLayers: "Espera mientras se cargan las capas.",
    settingsConfigureTitle: "Configurar campos de capa",
    layerTable : {
      colEnrich : "Enriquecer",
      colLabel : "Capa",
      colFieldSelector : "Campos"
    },
    fieldTable : {
      colAppend : "Adjuntar",
      colName : "Nombre",
      colAlias : "Alias",
      colOrder : "Orden",
      label : "Selecciona el campo que deseas anexar. Selecciona un campo para cambiar su alias, ordenarlo y asignarle formato."
    },
    symbolArea : {
      symbolLabelWithin : 'Selecciona el símbolo para las ubicaciones situadas dentro de:',
      symbolLabelOutside : 'Selecciona el símbolo para las ubicaciones situadas fuera de:'
    },
    advSettings : {
      label: "Configuración avanzada",
      latFieldsDesc : "Posibles nombres del campo Latitud.",
      longFieldsDesc : "Posibles nombres del campo Longitud.",
      intersectFieldDesc : "Nombre del campo creado para almacenar el valor si la búsqueda se ha intersecado con una capa.",
      intersectInDesc : "Valor que se debe almacenar cuando la ubicación se ha intersecado con un polígono.",
      intersectOutDesc : "Valor que se debe almacenar cuando la ubicación no se ha intersecado con un polígono.",
      maxRowCount : "Número máximo de filas en el archivo CSV.",
      cacheNumberDesc : "Umbral de clúster de puntos para un procesamiento más rápido.",
      subTitle : "Define los valores para el archivo CSV."
    },
    noPolygonLayers : "No hay capas de polígonos",
    errorOnOk : "Rellena todos los parámetros antes de guardar la configuración",
    saveFields : "Guardar campos",
    cancelFields : "Cancelar campos",
    saveAdv : "Guardar configuración avanzada",
    cancelAdv : "Cancelar configuración avanzada",
    advSettingsBtn : "Configuración avanzada",
    chooseSymbol: "Elige un símbolo",
    okBtn: "Aceptar",
    cancelBtn: "Cancelar"
  })
);
