define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Sirvige või lohistage <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> tööleht </a> siia visualiseerimiseks ja sellele kaardiandmete lisamiseks.",
    selectCSV : "Valige CSV",
    loadingCSV : "CSV laadimine",
    savingCSV: "CSVExport",
    clearResults : "Eemalda",
    downloadResults : "Laadi alla",
    plotOnly : "Ainult punktdiagrammi punktid",
    plottingRows : "Diagrammipunktide read",
    messages : "Sõnumid",
    error : {
      fetchingCSV : 'Tõrge üksuste toomisel CSV formaadist: ${0}',
      fileIssue : 'Faili ei saa töödelda.',
      notCSVFile : 'Praegu toetatakse ainult komaeraldusega faile (.csv).',
      invalidCoord : 'Asukoha väljad on kehtetud. Kontrollige CSV faili.',
      tooManyRecords : 'Praegu saab kasutada kuni ${0} kirjet.'
    },
    results : {
      csvLoaded : "CSV failist on laaditud ${0} kirjet",
      recordsPlotted : "${0}/${1} kirje asukoht on pandud kaardile",
      recordsEnriched : "${0}/${1} töödeldud, ${2} rikastatud üksuse ${3} baasil",
      recordsError : "${0} kirjet sisaldab vigu",
      recordsErrorList : "Real ${0} on probleem",
      label: "CSV tulemused"
    }
  })
);
