define(
   ({
    _widgetLabel : "Recherche géographique",
    description : "Accédez à une <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'>feuille de calcul</a> ou faites-la glisser ici pour la visualiser et y ajouter des données cartographiques.",
    selectCSV : "Sélectionner un fichier CSV",
    loadingCSV : "Chargement au format CSV",
    savingCSV: "Exportation au format CSV",
    clearResults : "Effacer",
    downloadResults : "Téléchargement",
    plotOnly : "Tracer uniquement les points",
    plottingRows : "Traçage des lignes",
    messages : "Messages",
    error : {
      fetchingCSV : 'Erreur de récupération des éléments depuis le stockage CSV : ${0}',
      fileIssue : 'Le fichier n\'a pas pu être traité.',
      notCSVFile : 'Seuls les fichiers dont les valeurs sont délimitées par des virgules (.csv) sont pris en charge actuellement.',
      invalidCoord : 'Les champs d\'emplacement ne sont pas valides. Vérifiez le fichier .csv.',
      tooManyRecords : 'Vous ne pouvez actuellement pas entrer plus de ${0} enregistrements.'
    },
    results : {
      csvLoaded : "${0} enregistrements ont été chargés depuis le fichier CSV",
      recordsPlotted : "${0}/${1} enregistrements ont été localisés sur la carte",
      recordsEnriched : "${0}/${1} traités, ${2} enrichis sur ${3}",
      recordsError : "${0} enregistrements comportaient des erreurs",
      recordsErrorList : "La ligne ${0} présente un problème",
      label: "Résultats CSV"
    }
  })
);
