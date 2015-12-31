define(
   ({
    _widgetLabel : "Ģeogrāfiskā meklēšana",
    description : "Pārlūkojiet līdz <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> izklājlapai </a> vai velciet to šeit, lai vizualizētu, un pievienojiet tai kartes datus.",
    selectCSV : "Atlasiet CSV failu",
    loadingCSV : "Ielādē CSV failu",
    savingCSV: "CSV eksportēšana",
    clearResults : "Notīrīt",
    downloadResults : "Lejupielāde",
    plotOnly : "Tikai plāna punkti",
    plottingRows : "Plāna rindas",
    messages : "Ziņojumi",
    error : {
      fetchingCSV : 'Kļūda, ienesot vienumus no CSV krātuves: ${0}',
      fileIssue : 'Failu nevarēja apstrādāt.',
      notCSVFile : 'Pašlaik tiek atbalstīti tikai ar komatiem atdalīti faili (.csv).',
      invalidCoord : 'Izvietojumu lauki nav derīgi. Lūdzu, pārbaudiet .csv.',
      tooManyRecords : 'Diemžēl pašlaik var izmantot ne vairāk kā ${0} ierakstus.'
    },
    results : {
      csvLoaded : "Ir ielādēti ${0} ieraksti no CSV faila",
      recordsPlotted : "${0}/${1} ieraksti ir atrasti kartē",
      recordsEnriched : "${0}/${1} apstrādāti, ${2} bagātināti pret ${3}",
      recordsError : "${0} ierakstos bija kļūdas",
      recordsErrorList : "${0}. rindā radusies problēma",
      label: "CSV rezultāti"
    }
  })
);
