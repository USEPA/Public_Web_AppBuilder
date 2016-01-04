define(
   ({
    page1: {
      selectToolHeader: "選擇批次更新記錄的方法。",
      selectToolDesc: "Widget 支援產生一組選取更新記錄的 3 種方法。只能選擇其中一種方法。若您需要一種以上的這些方法，請建立 Widget 的新執行個體。",
      selectByShape: "按區域選擇",
      selectBySpatQuery: "按圖徵選擇",
      selectByAttQuery: "按圖徵與相關圖徵選擇",
      selectByQuery: "按查詢選擇",
      toolNotSelected: "請選擇一個選擇方法"
    },
    page2: {
      layersToolHeader: "選擇要更新的圖層及選擇工具選項 (若有的話)。",
      layersToolDesc: "您在第一頁挑選的選擇方法將用來選擇和更新下列圖層集。如果您勾選多個圖層，則只能更新一般的可編輯欄位。依據您選擇的選擇工具，將需要其他選項。",
      layerTable: {
        colUpdate: "更新",
        colLabel: "圖層(L)",
        colSelectByLayer: "按圖層選擇",
        colSelectByField: "查詢欄位",
        colhighlightSymbol: "突顯符號"
      },
      toggleLayers: "切換圖層可見度開關",
      noEditableLayers: "無可編輯的圖層",
      noLayersSelected: "先選擇一或多個圖層再繼續。"
    },
    page3: {
      commonFieldsHeader: "選擇要批次更新的欄位。",
      commonFieldsDesc: "下列只會顯示一般的可編輯欄位。請選擇要更新的欄位。如果來自不同圖層的相同欄位具有不同的網域，只會顯示和使用一個網域。",
      noCommonFields: "無一般欄位",
      fieldTable: {
        colEdit: "可編輯",
        colName: "名稱",
        colAlias: "別名",
        colAction: "操作"
      }
    },
    tabs: {
      selection: "定義選擇類型",
      layers: "定義要更新的圖層",
      fields: "定義要更新的欄位"
    },
    errorOnOk: "請先填寫所有參數再儲存配置",
    next: "下一頁",
    back: "返回",
    save: "儲存符號",
    cancel: "取消",
    ok: "確定",
    symbolPopup: "符號選擇器"
  })
);
