define(
   ({
    _widgetLabel : "GeoLookup",
    description : "マップ データを視覚化し、<a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'>スプレッドシート</a>に追加するには、スプレッドシートを参照するか、スプレッドシートをここにドラッグします。",
    selectCSV : "CSV の選択",
    loadingCSV : "CSV を読み込んでいます",
    savingCSV: "CSVExport",
    clearResults : "消去",
    downloadResults : "ダウンロード",
    plotOnly : "ポイントのみをプロット",
    plottingRows : "行をプロットしています",
    messages : "メッセージ",
    error : {
      fetchingCSV : 'CSV ストアからのアイテムの取得中にエラーが発生しました: ${0}',
      fileIssue : 'ファイルを処理できませんでした。',
      notCSVFile : '現在、カンマ区切りファイル (*.csv) のみがサポートされています。',
      invalidCoord : '位置フィールドが無効です。*.csv を確認してください。',
      tooManyRecords : '現在、${0} より多いレコード数は許可されません。'
    },
    results : {
      csvLoaded : "CSV ファイルから ${0} レコードが読み込まれました",
      recordsPlotted : "${0}/${1} レコードがマップに配置されました",
      recordsEnriched : "${0}/${1} が処理され、${2} は ${3} に対して情報が付加されました",
      recordsError : "${0} レコードにエラーがありました",
      recordsErrorList : "行 ${0} に問題があります",
      label: "CSV の結果"
    }
  })
);
