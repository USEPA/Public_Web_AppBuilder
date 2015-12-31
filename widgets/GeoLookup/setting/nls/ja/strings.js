define(
   ({
    settingsHeader : "GeoLookup ウィジェットの詳細の設定",
    settingsDesc : "マップ上のポリゴン レイヤーに対して、CSV ファイルから読み込んだ位置のリストに地理情報を付加します。ポリゴン レイヤーから選択したフィールドが位置に追加されます。",
    settingsLoadingLayers: "レイヤーを読み込んでいます。しばらくお待ちください。",
    settingsConfigureTitle: "レイヤー フィールドの構成",
    layerTable : {
      colEnrich : "情報付加",
      colLabel : "レイヤー",
      colFieldSelector : "フィールド"
    },
    fieldTable : {
      colAppend : "追加",
      colName : "名前",
      colAlias : "エイリアス",
      colOrder : "順序",
      label : "追加するフィールドのチェックボックスをオンにします。フィールドを選択して、エイリアスの変更、並べ替え、および書式設定を行います。"
    },
    symbolArea : {
      symbolLabelWithin : '次の範囲内の位置のシンボルを選択します:',
      symbolLabelOutside : '次の範囲外の位置のシンボルを選択します:'
    },
    advSettings : {
      label: "高度な設定",
      latFieldsDesc : "緯度情報が格納されているフィールド名",
      longFieldsDesc : "経度情報が格納されているフィールド名",
      intersectFieldDesc : "レイヤーと交差した場合に作成される、値が格納されたフィールド名",
      intersectInDesc : "位置がポリゴンと交差した場合に格納する値",
      intersectOutDesc : "位置がポリゴンと交差しなかった場合に格納する値",
      maxRowCount : "CSV ファイル内の最大行数",
      cacheNumberDesc : "処理を高速化するためのポイント クラスター閾値",
      subTitle : "CSV ファイルの値を設定します。"
    },
    noPolygonLayers : "ポリゴン レイヤーがありません",
    errorOnOk : "構成を保存する前に、すべてのパラメーターに入力してください",
    saveFields : "フィールドの保存",
    cancelFields : "フィールドのキャンセル",
    saveAdv : "高度な設定の保存",
    cancelAdv : "高度な設定のキャンセル",
    advSettingsBtn : "高度な設定",
    chooseSymbol: "シンボルの選択",
    okBtn: "OK",
    cancelBtn: "キャンセル"
  })
);
