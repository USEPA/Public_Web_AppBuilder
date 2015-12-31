define(
   ({
    _widgetLabel: "Пакетный редактор атрибутов",
    widgetIntroSelectByArea: "Используйте один из указанных ниже инструментов для создания поднабора объектов для обновления.  Если строка <font class=\'maxRecordInIntro\'>выделена</font>, максимальное число записей превышено.",
    widgetIntroSelectByFeature: "Используйте инструмент ниже, чтобы выделить объект на слое <font class=\'layerInIntro\'>${0}</font>.  Этот объект будет использован для выборки и обновления всех пересекающихся с ним объектов.  Если строка <font class=\'maxRecordInIntro\'>выделена</font>, максимальное число записей превышено.",
    widgetIntroSelectByFeatureQuery: "Используйте инструмент ниже, чтобы выделить объект на слое <font class=\'layerInIntro\'>${0}</font>.  Атрибут <font class=\'layerInIntro\'>${1}</font> этого объекта будет использован для запроса указанных ниже слоев и обновления полученных объектов.  Если строка <font class=\'maxRecordInIntro\'>выделена</font>, максимальное число записей превышено.",
    widgetIntroSelectByQuery: "Введите значение для создания выбранных наборов.  Если строка <font class=\'maxRecordInIntro\'>выделена</font>, максимальное число записей превышено.",
    layerTable: {
      colLabel: "Имя слоя",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Нет настроенных слоев, доступных для редактирования",
    editorPopupTitle: "Пакетный редактор атрибутов",
    editorPopupSaveBtn: "Сохранить",
    editorPopupMultipleValues: "",
    clear: "Очистить",
    featuresUpdated: "${0} / ${1} объектов обновлено",
    featuresSelected: "${0} объектов выделено",
    featuresSkipped: "Пропущено",
    search: "Поиск",
    queryInput: "Введите значение для запроса",
    noFilterTip: "Если не задано выражение для фильтра, этот запрос перечислит все объекты указанного источника данных.",
    setFilterTip: "Задайте корректный фильтр.",
    filterPopup: "Фильтр слоя",
    cancel: "Отмена",
    ok: "OK",
    drawBox: {
      point: "Точка",
      line: "Линия",
      polyline: "Линия",
      freehandPolyline: "Произвольная полилиния",
      extent: "Экстент",
      polygon: "Полигон",
      freehandPolygon: "Полигон произвольной формы",
      clear: "Очистить",
      addPointToolTip: "Щелкните, чтобы создать выборку в этой области",
      addShapeToolTip: "Нарисуйте рамку, чтобы выбрать объекты",
      freehandToolTip: "Нажмите и удерживайте, чтобы нарисовать рамку для выбора объектов",
      startToolTip: "Нарисуйте рамку, чтобы выбрать объекты"
    },
    errors: {
      layerNotFound: "Слой ${0} с ID ${1} не был найден на карте, карта могла быть изменена после настройки виджета",
      queryNullID: "Объект из ${0} вернул недостоверный ID",
      noSelectedLayers: "Нет выбранных слоев с записями для обновления",
      inputValueError: "Недопустимое значение в форме"
    }
  })
);
