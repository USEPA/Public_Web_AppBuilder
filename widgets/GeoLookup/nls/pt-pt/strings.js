define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Navegue até aqui, ou arraste, uma <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> folha de cálculo </a> para visualizar, e à qual anexar dados de mapa.",
    selectCSV : "Selecione um ficheiro CSV",
    loadingCSV : "A carregar CSV",
    savingCSV: "CSVExport",
    clearResults : "Limpar",
    downloadResults : "Descarregar",
    plotOnly : "Apenas Pontos de Parcela",
    plottingRows : "Linhas de parcelamento",
    messages : "Mensagens",
    error : {
      fetchingCSV : 'Erro ao obter itens do armazenamento CSV: ${0}',
      fileIssue : 'Não foi possível processar o ficheiro.',
      notCSVFile : 'Apenas ficheiros delimitados por vírgulas (.csv) são suportados de momento.',
      invalidCoord : 'Os campos de localização são inválidos. Por favor, verifique o ficheiro .csv.',
      tooManyRecords : 'Lamentamos, não pode exceder os ${0} registos de momento.'
    },
    results : {
      csvLoaded : "${0} registos do ficheiro CSV foram carregados.",
      recordsPlotted : "${0}/${1} registos foram localizados no mapa",
      recordsEnriched : "${0}/${1} processados, ${2} enriquecidos em ${3}",
      recordsError : "${0} registos com erros",
      recordsErrorList : "A linha ${0} tem um problema",
      label: "Resultados CSV"
    }
  })
);
