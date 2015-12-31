define(
   ({
    _widgetLabel : "GeoLookup",
    description : "瀏覽或拖曳這裡要視覺化的 <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> 試算表 </a>，並在其中附加地圖資料。",
    selectCSV : "選擇 CSV",
    loadingCSV : "正在載入 CSV",
    savingCSV: "CSVExport",
    clearResults : "清除",
    downloadResults : "下載",
    plotOnly : "僅繪製點",
    plottingRows : "正在縮製列",
    messages : "訊息",
    error : {
      fetchingCSV : '從 CSV 存放區擷取項目時發生錯誤: ${0}',
      fileIssue : '無法處理檔案。',
      notCSVFile : '目前僅支援逗號分隔檔案 (.csv) 檔。',
      invalidCoord : '位置欄位無效。請檢查 .csv。',
      tooManyRecords : '很抱歉，目前的記錄不超過 ${0} 筆。'
    },
    results : {
      csvLoaded : "已從 CSV 檔案載入 ${0} 筆記錄",
      recordsPlotted : "${0}/${1} 記錄已位於地圖上",
      recordsEnriched : "${0}/${1} 已處理，已針對 ${3} 豐富化 ${2}",
      recordsError : "${0} 筆記錄發生錯誤",
      recordsErrorList : "列 ${0} 發生問題",
      label: "CSV 結果"
    }
  })
);
