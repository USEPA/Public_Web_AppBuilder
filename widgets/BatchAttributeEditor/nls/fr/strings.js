define(
   ({
    _widgetLabel: "Editeur d\'attributs par lots",
    widgetIntroSelectByArea: "Utilisez un des outils ci-dessous pour créer un jeu sélectionné d\'entités à mettre à jour.  Si la ligne est <font class=\'maxRecordInIntro\'>mise en surbrillance</font>, le nombre maximal d\'enregistrements autorisés a été dépassé.",
    widgetIntroSelectByFeature: "Utilisez l\'outil ci-dessous pour sélectionner une entité sur la couche <font class=\'layerInIntro\'>${0}</font>.  Cette entité sera utilisée pour sélectionner et mettre à jour toutes les entités d\'intersection.  Si la ligne est <font class=\'maxRecordInIntro\'>mise en surbrillance</font>, le nombre maximal d\'enregistrements autorisés a été dépassé.",
    widgetIntroSelectByFeatureQuery: "Utilisez l\'outil ci-dessous pour sélectionner une entité sur <font class=\'layerInIntro\'>${0}</font>.  L\'attribut <font class=\'layerInIntro\'>${1}</font> de cette entité sera utilisé pour interroger les couches ci-dessous et mettre à jour les entités obtenues.  Si la ligne est <font class=\'maxRecordInIntro\'>mise en surbrillance</font>, le nombre maximal d\'enregistrements autorisés a été dépassé.",
    widgetIntroSelectByQuery: "Entrez une valeur pour créer un jeu de sélection.  Si la ligne est <font class=\'maxRecordInIntro\'>mise en surbrillance</font>, le nombre maximal d\'enregistrements autorisés a été dépassé.",
    layerTable: {
      colLabel: "Nom de la couche",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Aucune couche modifiable configurée",
    editorPopupTitle: "Editeur d\'attributs par lots",
    editorPopupSaveBtn: "Enregistrer",
    editorPopupMultipleValues: "",
    clear: "Effacer",
    featuresUpdated: "${0} / ${1} entités mises à jour",
    featuresSelected: "${0} entité(s) sélectionnée(s)",
    featuresSkipped: "Contourné",
    search: "Rechercher",
    queryInput: "Entrez une valeur à interroger",
    noFilterTip: "Sans expression de filtre définie, cette tâche de requête répertorie toutes les entités dans la source de données spécifiée.",
    setFilterTip: "Définissez le filtre correctement.",
    filterPopup: "Filtrer la couche",
    cancel: "Annuler",
    ok: "OK",
    drawBox: {
      point: "point",
      line: "Ligne",
      polyline: "Polyligne",
      freehandPolyline: "Polyligne à main levée",
      extent: "Étendue",
      polygon: "Polygone",
      freehandPolygon: "Polygone à main levée",
      clear: "Effacer",
      addPointToolTip: "Cliquez pour effectuer une sélection dans cette zone",
      addShapeToolTip: "Dessinez une forme pour sélectionner des entités",
      freehandToolTip: "Maintenez le bouton de la souris enfoncé pour dessiner une forme et sélectionner des entités",
      startToolTip: "Dessinez une forme pour sélectionner des entités"
    },
    errors: {
      layerNotFound: "La couche ${0} portant l\'ID ${1} est introuvable sur la carte. Elle a peut-être changé depuis la configuration des widgets",
      queryNullID: "L\'entité de ${0} a renvoyé un ID non valide",
      noSelectedLayers: "Aucune couche sélectionnée avec des enregistrements à mettre à jour",
      inputValueError: "Valeur non valide dans le formulaire"
    }
  })
);
