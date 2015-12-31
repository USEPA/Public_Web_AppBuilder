define(
   ({
    _widgetLabel : "Geohaku",
    description : "Selaa laskentataulukkoon tai vedä <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> laskentataulukko </a> tähän, jotta voit visualisoida ja liittää kartan tietoja siihen.",
    selectCSV : "Valitse CSV",
    loadingCSV : "Ladataan CSV-tiedostoa",
    savingCSV: "CSVExport",
    clearResults : "Tyhjennä",
    downloadResults : "Lataa",
    plotOnly : "Vain piirtopisteet",
    plottingRows : "Piirretään rivejä",
    messages : "Viestit",
    error : {
      fetchingCSV : 'Virhe noudettaessa kohteita CSV-säilöstä: ${0}',
      fileIssue : 'Tiedoston käsittely epäonnistui.',
      notCSVFile : 'Tällä hetkellä tuetaan vain pilkuin eroteltuja tiedostoja (.csv).',
      invalidCoord : 'Sijaintikentät ovat virheellisiä. Tarkista .csv.',
      tooManyRecords : 'Tietueiden enimmäismäärä on tällä hetkellä ${0}.'
    },
    results : {
      csvLoaded : "CSV-tiedostosta ladattiin ${0} tietuetta",
      recordsPlotted : "${0}/${1} tietuetta on sijoitettu karttaan",
      recordsEnriched : "${0}/${1} käsitelty, ${2}/${3} rikastettu",
      recordsError : "${0} tietueessa on virheitä",
      recordsErrorList : "Rivillä ${0} on virhe",
      label: "CSV-tulokset"
    }
  })
);
