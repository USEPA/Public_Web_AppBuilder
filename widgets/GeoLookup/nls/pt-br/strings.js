define(
   ({
    _widgetLabel : "Pesquisa Geográfica",
    description : "Procure ou Arraste uma <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> planilha </a> aqui para visualizar e acrescentar dados de mapa nela.",
    selectCSV : "Selecionar um CSV",
    loadingCSV : "Carregando CSV",
    savingCSV: "CSVExport",
    clearResults : "Apagar",
    downloadResults : "Download",
    plotOnly : "Plotar Pontos Somente",
    plottingRows : "Plotando linhas",
    messages : "Mensagens",
    error : {
      fetchingCSV : 'Erro ao buscar itens do armzenamento de CSV: ${0}',
      fileIssue : 'Não foi possível processar o arquivo.',
      notCSVFile : 'Somente arquivos delimitados por vírgula (.csv) são suportados neste momento.',
      invalidCoord : 'Os campos de localização são inválidos. Verifique o arquivo .csv.',
      tooManyRecords : 'Não mais que ${0} registros neste momento.'
    },
    results : {
      csvLoaded : "${0} registros do arquivo CSV foram carregados",
      recordsPlotted : "${0}/${1} registros foram localizados no mapa",
      recordsEnriched : "${0}/${1} processados, ${2} enriquecidos em relação ao ${3}",
      recordsError : "${0} registros têm erros",
      recordsErrorList : "A linha ${0} tem um problema",
      label: "Resultados do CSV"
    }
  })
);
