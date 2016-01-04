define(
   ({
    _widgetLabel : "Geobúsqueda",
    description : "Examina o arrastra una <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> hoja de cálculo </a> aquí para visualizarla y anexar datos del mapa a la hoja.",
    selectCSV : "Selecciona un archivo CSV",
    loadingCSV : "Cargando CSV",
    savingCSV: "CSVExport",
    clearResults : "Borrar",
    downloadResults : "Descargar",
    plotOnly : "Trazar solo puntos",
    plottingRows : "Trazando filas",
    messages : "Mensajes",
    error : {
      fetchingCSV : 'Error al obtener elementos del almacén de CSV: ${0}',
      fileIssue : 'El archivo no se ha podido procesar.',
      notCSVFile : 'Actualmente, solo se admiten los archivos delimitados por comas (.csv).',
      invalidCoord : 'Los campos de ubicación no son válidos. Comprueba el archivo .csv.',
      tooManyRecords : 'Lo lamentamos, no puedes usar más de ${0} registros.'
    },
    results : {
      csvLoaded : "Se han cargado ${0} registros del archivo CSV",
      recordsPlotted : "Se han localizado ${0}/${1} registros en el mapa",
      recordsEnriched : "${0}/${1} procesados, ${2} enriquecidos de ${3}",
      recordsError : "${0} registros tenían errores",
      recordsErrorList : "La fila ${0} tiene un problema",
      label: "Resultados del CSV"
    }
  })
);
