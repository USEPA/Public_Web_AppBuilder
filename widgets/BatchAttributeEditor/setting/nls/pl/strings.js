define(
   ({
    page1: {
      selectToolHeader: "Określ metodę wyboru rekordów do aktualizowania wsadowego.",
      selectToolDesc: "Widżet obsługuje trzy metody generowania wybranego zestawu rekordów do aktualizacji. Można wybrać tylko jedną z metod. Jeśli trzeba użyć więcej niż jednej metody, utwórz nową instancję widoku.",
      selectByShape: "Wybierz według obszaru",
      selectBySpatQuery: "Wybierz według obiektu",
      selectByAttQuery: "Wybierz według obiektu i obiektów powiązanych",
      selectByQuery: "Wybierz według zapytania",
      toolNotSelected: "Określ metodę wyboru"
    },
    page2: {
      layersToolHeader: "Wybierz warstwy do uaktualnienia i opcje narzędzi wyboru (jeżeli są).",
      layersToolDesc: "Metoda wybrana na pierwszej stronie będzie używana do wybierania i aktualizacji przedstawionego poniżej zestawu warstw. W przypadku sprawdzania więcej niż jednej warstwy, do aktualizacji dostępne będą tylko edytowalne wspólne pola. Wymagane będą opcje dodatkowe w zależności od wybranego narzędzia.",
      layerTable: {
        colUpdate: "Zmień",
        colLabel: "Warstwa",
        colSelectByLayer: "Wybierz  według warstwy",
        colSelectByField: "Pole zapytania",
        colhighlightSymbol: "Symbol podświetlenia"
      },
      toggleLayers: "Przełączaj widzialność warstw na otwarte/zamknięte",
      noEditableLayers: "Brak edytowalnych warstw",
      noLayersSelected: "Najpierw wybierz przynajmniej jedną warstwę"
    },
    page3: {
      commonFieldsHeader: "Wybierz pola do aktualizacji wsadowej.",
      commonFieldsDesc: "Poniżej przedstawione będą tylko edytowalne wspólne pola. Wybierz pola, które chcesz aktualizować. Jeżeli to samo pole z różnych warstw ma różne domeny, pokazana i używana będzie tylko jedna domena.",
      noCommonFields: "Brak wspólnych pól",
      fieldTable: {
        colEdit: "Edytowalne",
        colName: "Nazwa",
        colAlias: "Alias",
        colAction: "Operacja"
      }
    },
    tabs: {
      selection: "Zdefiniuj rodzaj wyboru",
      layers: "Zdefiniuj warstwy do aktualizacji",
      fields: "Zdefiniuj pola do aktualizacji"
    },
    errorOnOk: "Przed zapisaniem konfiguracji należy wprowadzić wszystkie parametry",
    next: "Dalej",
    back: "Powrót",
    save: "Zapisz symbol",
    cancel: "Anuluj",
    ok: "OK",
    symbolPopup: "Wybór symbolu"
  })
);
