define(
   ({
    _widgetLabel : "GeoLookup",
    description : "浏览至此处或将<a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'>电子表格</a>拖放至此处进行查看，并为其追加地图数据。",
    selectCSV : "选择 CSV",
    loadingCSV : "加载 CSV",
    savingCSV: "CSVExport",
    clearResults : "清除",
    downloadResults : "下载",
    plotOnly : "仅为绘制点",
    plottingRows : "绘制行",
    messages : "消息",
    error : {
      fetchingCSV : '从 CSV 存储提取项目时出错: ${0}',
      fileIssue : '无法处理文件。',
      notCSVFile : '当前仅支持逗号分隔的文件(.csv)文件。',
      invalidCoord : '位置字段无效。请检查 .csv。',
      tooManyRecords : '抱歉，目前不能超过 ${0} 条记录。'
    },
    results : {
      csvLoaded : "已从 CSV 文件中加载 ${0} 条记录",
      recordsPlotted : "地图上已有 ${0}/${1} 条记录",
      recordsEnriched : "已处理 ${0}/${1}，已根据 ${3} 丰富 ${2}",
      recordsError : "${0} 条记录出错",
      recordsErrorList : "行 ${0} 存在问题",
      label: "CSV 结果"
    }
  })
);
