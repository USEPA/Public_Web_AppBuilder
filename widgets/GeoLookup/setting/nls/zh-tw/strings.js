define(
   ({
    settingsHeader : "設定 GeoLookup Widget 的詳細資訊",
    settingsDesc : "針對地圖上的多邊形圖層，豐富化 CSV 檔案的地理位置清單。會將來自多邊形圖層的所選欄位附加至位置。",
    settingsLoadingLayers: "請稍候，圖層正在載入。",
    settingsConfigureTitle: "配置圖層欄位",
    layerTable : {
      colEnrich : "豐富化",
      colLabel : "圖層(L)",
      colFieldSelector : "欄位"
    },
    fieldTable : {
      colAppend : "附加",
      colName : "名稱",
      colAlias : "別名",
      colOrder : "順序(O)",
      label : "勾選要附加的欄位。選擇欄位以變更其別名、對其排序並設定其格式。"
    },
    symbolArea : {
      symbolLabelWithin : '為下列範圍內的位置選擇符號:',
      symbolLabelOutside : '為下列範圍外的位置選擇符號:'
    },
    advSettings : {
      label: "進階設定",
      latFieldsDesc : "「緯度」欄位的可能欄位名稱。",
      longFieldsDesc : "「經度」欄位的可能欄位名稱。",
      intersectFieldDesc : "如果查找相交圖層，則為建立來存放值的欄位名稱。",
      intersectInDesc : "當位置相交多邊形時用來儲存的值。",
      intersectOutDesc : "當位置未與多邊形相交時用來儲存的值。",
      maxRowCount : "CSV 檔案中的列數上限。",
      cacheNumberDesc : "用於加速處理的點叢集閾值。",
      subTitle : "設定 CSV 檔案的值。"
    },
    noPolygonLayers : "無多邊形圖層",
    errorOnOk : "請先填寫所有參數再儲存配置",
    saveFields : "儲存欄位",
    cancelFields : "取消欄位",
    saveAdv : "儲存進階設定",
    cancelAdv : "取消進階設定",
    advSettingsBtn : "進階設定",
    chooseSymbol: "選擇符號",
    okBtn: "確定",
    cancelBtn: "取消"
  })
);
