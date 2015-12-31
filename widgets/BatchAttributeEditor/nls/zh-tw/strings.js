define(
   ({
    _widgetLabel: "批次屬性編輯器",
    widgetIntroSelectByArea: "使用下列其中一個工具來建立要更新的所選圖徵集。如果<font class=\'maxRecordInIntro\'>突顯</font>列，則表示已超過記錄數上限。",
    widgetIntroSelectByFeature: "使用下列工具從 <font class=\'layerInIntro\'>${0}</font> 圖層選擇圖徵。此圖徵將用來選擇和更新所有相交圖徵。如果<font class=\'maxRecordInIntro\'>突顯</font>列，則表示已超過記錄數上限。",
    widgetIntroSelectByFeatureQuery: "使用下列工具從 <font class=\'layerInIntro\'>${0}</font> 選擇圖徵。此圖徵的 <font class=\'layerInIntro\'>${1}</font> 屬性將用來查詢下列圖層及更新結果圖徵。如果<font class=\'maxRecordInIntro\'>突顯</font>列，則表示已超過記錄數上限。",
    widgetIntroSelectByQuery: "輸入值來建立選擇集。如果<font class=\'maxRecordInIntro\'>突顯</font>列，則表示已超過記錄數上限。",
    layerTable: {
      colLabel: "圖層名稱",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "未配置可編輯的圖層",
    editorPopupTitle: "批次屬性編輯器",
    editorPopupSaveBtn: "儲存",
    editorPopupMultipleValues: "",
    clear: "清除",
    featuresUpdated: "已更新 ${0} / ${1} 圖徵",
    featuresSelected: "已選擇 ${0} 圖徵",
    featuresSkipped: "已略過",
    search: "搜尋",
    queryInput: "輸入要查詢的值",
    noFilterTip: "在未定義篩選表達式的情況下，此查詢任務會列出指定資料來源中的所有圖徵。",
    setFilterTip: "請正確設定篩選程式。",
    filterPopup: "篩選圖層",
    cancel: "取消",
    ok: "確定",
    drawBox: {
      point: "點(P)",
      line: "線",
      polyline: "折線",
      freehandPolyline: "手繪折線",
      extent: "範圍",
      polygon: "面",
      freehandPolygon: "手繪多邊形",
      clear: "清除",
      addPointToolTip: "按一下以在此區域中選擇",
      addShapeToolTip: "繪製形狀以選擇圖徵",
      freehandToolTip: "按住以繪製形狀來選擇圖徵",
      startToolTip: "繪製形狀以選擇圖徵"
    },
    errors: {
      layerNotFound: "在地圖中找不到包含 ID ${1} 的圖層 ${0}，地圖在 widget 配置後可能已變更",
      queryNullID: "${0} 的圖徵傳回無效的 ID",
      noSelectedLayers: "沒有包含要更新記錄的所選圖層",
      inputValueError: "表單中有無效值"
    }
  })
);
