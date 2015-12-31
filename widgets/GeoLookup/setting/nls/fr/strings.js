define(
   ({
    settingsHeader : "Définir les détails du widget de recherche géographique",
    settingsDesc : "Enrichissez géographiquement une liste d\'emplacements à partir d\'un fichier CSV sur les couches surfaciques de la carte. Les champs sélectionnés dans les couches surfaciques sont ajoutés aux emplacements.",
    settingsLoadingLayers: "Patientez pendant le chargement des couches.",
    settingsConfigureTitle: "Configurer les champs de couche",
    layerTable : {
      colEnrich : "Ajouter des données",
      colLabel : "Couche",
      colFieldSelector : "Champs"
    },
    fieldTable : {
      colAppend : "Ajouter",
      colName : "Nom",
      colAlias : "Alias",
      colOrder : "Commande",
      label : "Sélectionnez le champ à ajouter. Sélectionnez un champ pour changer son alias, le classer et le mettre en forme."
    },
    symbolArea : {
      symbolLabelWithin : 'Sélectionnez le symbole des emplacements à l\'intérieur de :',
      symbolLabelOutside : 'Sélectionnez le symbole des emplacements à l\'extérieur de :'
    },
    advSettings : {
      label: "Paramètres avancés",
      latFieldsDesc : "Noms possibles pour le champ Latitude.",
      longFieldsDesc : "Noms possibles pour le champ Longitude.",
      intersectFieldDesc : "Le nom du champ créé pour stocker la valeur si la recherche intersecte une couche.",
      intersectInDesc : "Valeur à stocker lorsque l\'emplacement intersecte un polygone.",
      intersectOutDesc : "Valeur à stocker lorsque l\'emplacement n\'intersecte pas un polygone.",
      maxRowCount : "Nombre maximum de lignes dans le fichier CSV.",
      cacheNumberDesc : "Seuil d\'agrégation des points pour accélérer le traitement.",
      subTitle : "Définissez les valeurs du fichier CSV."
    },
    noPolygonLayers : "Aucune couche surfacique",
    errorOnOk : "Renseignez tous les paramètres avant d\'enregistrer la configuration",
    saveFields : "Enregistrer les champs",
    cancelFields : "Annuler les champs",
    saveAdv : "Enregistrer les paramètres avancés",
    cancelAdv : "Annuler les paramètres avancés",
    advSettingsBtn : "Paramètres avancés",
    chooseSymbol: "Choisir un symbole",
    okBtn: "OK",
    cancelBtn: "Annuler"
  })
);
