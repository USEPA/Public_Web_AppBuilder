define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Выберите или перетащите <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> электронную таблицу </a> сюда для визуализации и присоединения в ней данных с карты.",
    selectCSV : "Выберите CSV",
    loadingCSV : "Выполняется загрузка CSV",
    savingCSV: "CSVExport",
    clearResults : "Очистить",
    downloadResults : "Загрузка",
    plotOnly : "Только точки планов",
    plottingRows : "Строки планов",
    messages : "Сообщения",
    error : {
      fetchingCSV : 'Ошибка сопоставления элементов из хранилища CSV: ${0}',
      fileIssue : 'Файл не может быть обработан.',
      notCSVFile : 'В настоящий момент поддерживаются только файлы со значениями, разделенными запятыми (.csv).',
      invalidCoord : 'Недопустимые поля местоположений. Проверьте файл .csv.',
      tooManyRecords : 'Не более ${0} записей в данный момент.'
    },
    results : {
      csvLoaded : "Загружено ${0} записей из файла CSV",
      recordsPlotted : "${0}/${1} записей были расположены на карте",
      recordsEnriched : "${0}/${1} обработано, ${2} обогащено из ${3}",
      recordsError : "${0} записей содержат ошибки",
      recordsErrorList : "Строка ${0} содержит ошибку",
      label: "Результаты CSV"
    }
  })
);
