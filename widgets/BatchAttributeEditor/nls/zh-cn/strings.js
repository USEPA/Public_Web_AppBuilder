define(
   ({
    _widgetLabel: "批处理属性编辑器",
    widgetIntroSelectByArea: "使用下列工具之一创建要更新的一组要素。如果该行为<font class=\'maxRecordInIntro\'>高亮显示</font>，则表明已超出最大记录数。",
    widgetIntroSelectByFeature: "使用以下工具从 <font class=\'layerInIntro\'>${0}</font> 图层中选择要素。该要素将用来选择和更新所有相交要素。如果该行为<font class=\'maxRecordInIntro\'>高亮显示</font>，则表明已超出最大记录数。",
    widgetIntroSelectByFeatureQuery: "使用以下工具从 <font class=\'layerInIntro\'>${0}</font> 中选择要素。该要素的 <font class=\'layerInIntro\'>${1}</font> 属性将用来查询以下图层并更新生成的要素。如果该行为<font class=\'maxRecordInIntro\'>高亮显示</font>，则表明已超出最大记录数。",
    widgetIntroSelectByQuery: "输入值以创建选择集。如果该行为<font class=\'maxRecordInIntro\'>高亮显示</font>，则表明已超出最大记录数。",
    layerTable: {
      colLabel: "图层名称",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "未配置可编辑图层",
    editorPopupTitle: "批处理属性编辑器",
    editorPopupSaveBtn: "保存",
    editorPopupMultipleValues: "",
    clear: "清除",
    featuresUpdated: "已更新 ${0} / ${1} 要素",
    featuresSelected: "已选定 ${0} 要素",
    featuresSkipped: "已忽略",
    search: "搜索",
    queryInput: "输入要查询的值",
    noFilterTip: "在未定义过滤表达式的情况下，此查询任务会列出指定数据源中的所有要素。",
    setFilterTip: "请正确设置过滤器。",
    filterPopup: "过滤图层",
    cancel: "取消",
    ok: "确定",
    drawBox: {
      point: "点",
      line: "线",
      polyline: "折线",
      freehandPolyline: "手绘折线",
      extent: "范围",
      polygon: "面",
      freehandPolygon: "手绘面",
      clear: "清除",
      addPointToolTip: "单击以在此区域中选择",
      addShapeToolTip: "绘制形状以选择要素",
      freehandToolTip: "按住并绘制形状以选择要素",
      startToolTip: "绘制形状以选择要素"
    },
    errors: {
      layerNotFound: "地图中未发现 ID为 ${1} 的图层 ${0}，地图可能在微件配置时发生了更改",
      queryNullID: "${0} 的要素返回了无效 ID",
      noSelectedLayers: "所选图层中未含有要更新的记录",
      inputValueError: "表单中的无效值"
    }
  })
);
