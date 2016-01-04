define(
   ({
    settingsHeader : "设置 GeoLookup 微件的详细信息",
    settingsDesc : "根据地图上的面图层丰富 CSV 文件位置列表。面图层中的所选字段将追加到这些位置中。",
    settingsLoadingLayers: "正在加载图层，请稍候。",
    settingsConfigureTitle: "配置图层字段",
    layerTable : {
      colEnrich : "丰富",
      colLabel : "图层",
      colFieldSelector : "字段"
    },
    fieldTable : {
      colAppend : "追加",
      colName : "名称",
      colAlias : "别名",
      colOrder : "顺序",
      label : "检查您希望追加的字段。选择字段以更改其别名、对其排序并设置其格式。"
    },
    symbolArea : {
      symbolLabelWithin : '从以下位置选择符号:',
      symbolLabelOutside : '从以下位置外选择符号:'
    },
    advSettings : {
      label: "高级设置",
      latFieldsDesc : "纬度字段的可能字段名称。",
      longFieldsDesc : "经度字段的可能字段名称。",
      intersectFieldDesc : "在查找与图层相交时为存储值而创建的字段的名称。",
      intersectInDesc : "位置与面相交时要存储的值。",
      intersectOutDesc : "位置未与面相交时要存储的值。",
      maxRowCount : "CSV 文件的最大行数。",
      cacheNumberDesc : "用于加速处理的点聚类阈值。",
      subTitle : "设置 CSV 文件的值。"
    },
    noPolygonLayers : "无面图层",
    errorOnOk : "请在保存配置前填写所有参数",
    saveFields : "保存字段",
    cancelFields : "取消字段",
    saveAdv : "保存高级设置",
    cancelAdv : "取消高级设置",
    advSettingsBtn : "高级设置",
    chooseSymbol: "选择符号",
    okBtn: "确定",
    cancelBtn: "取消"
  })
);
