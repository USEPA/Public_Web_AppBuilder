define(
   ({
    page1: {
      selectToolHeader: "Choisissez une méthode de sélection des enregistrements à mettre à jour par lots.",
      selectToolDesc: "Le widget accepte 3 méthodes pour générer un ensemble sélectionné d\'enregistrements à mettre à jour. Vous ne pouvez choisir qu\'une méthode. Si vous devez en choisir plusieurs, créez une nouvelle instance du widget.",
      selectByShape: "Sélectionner par zone",
      selectBySpatQuery: "Sélectionner par entité",
      selectByAttQuery: "Sélectionner par entité et entités associées",
      selectByQuery: "Sélectionner par requête",
      toolNotSelected: "Choisissez une méthode de sélection"
    },
    page2: {
      layersToolHeader: "Sélectionnez les couches à mettre à jour et les options des outils de sélection, le cas échéant.",
      layersToolDesc: "La méthode de sélection que vous avez choisie sur la page sera utilisée pour sélectionner et mettre à jour le jeu de couches répertorié ci-dessous.  Si vous sélectionnez plusieurs couches, seuls les champs modifiables communs peuvent être mis à jour.  Selon l\'outil de sélection choisi, des options supplémentaires peuvent être requises.",
      layerTable: {
        colUpdate: "Mise à jour",
        colLabel: "Couche",
        colSelectByLayer: "Sélectionner par couche",
        colSelectByField: "Champ de requête",
        colhighlightSymbol: "Symbole de surbrillance :"
      },
      toggleLayers: "Modifier la visibilité des couches à l\'ouverture et la fermeture",
      noEditableLayers: "Aucune couche modifiable",
      noLayersSelected: "Sélectionnez une ou plusieurs couches pour continuer"
    },
    page3: {
      commonFieldsHeader: "Sélectionnez les champs à mettre à jour par lots.",
      commonFieldsDesc: "Seuls les champs modifiables communs sont présentés ci-dessous.  Sélectionnez les champs que vous souhaitez mettre à jour.  Si le même champ issu de différentes couches possède un domaine différent, un seul domaine est affiché et utilisé.",
      noCommonFields: "Aucun champ commun",
      fieldTable: {
        colEdit: "Modifiable",
        colName: "Nom",
        colAlias: "Alias",
        colAction: "Action"
      }
    },
    tabs: {
      selection: "Définir le type de sélection",
      layers: "Définir les couches à mettre à jour",
      fields: "Définir les champs à mettre à jour"
    },
    errorOnOk: "Renseignez tous les paramètres avant d\'enregistrer la configuration",
    next: "Suivant",
    back: "Retour",
    save: "Enregistrer le symbole",
    cancel: "Annuler",
    ok: "OK",
    symbolPopup: "Sélecteur de symboles"
  })
);
